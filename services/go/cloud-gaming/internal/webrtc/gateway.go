package webrtc

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/digao/cloud-gaming/internal/input"
	"github.com/digao/cloud-gaming/internal/stream"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
)

type Gateway struct {
	streamSource  stream.Source
	inputHandler  *input.Handler
	frameDuration time.Duration
}

type signalMessage struct {
	Type      string                   `json:"type"`
	SDP       string                   `json:"sdp,omitempty"`
	Candidate *webrtc.ICECandidateInit `json:"candidate,omitempty"`
	Payload   json.RawMessage          `json:"payload,omitempty"`
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(_ *http.Request) bool {
		return true
	},
}

func NewGateway(streamSource stream.Source, inputHandler *input.Handler, fps int) *Gateway {
	if fps <= 0 {
		fps = 60
	}

	return &Gateway{
		streamSource:  streamSource,
		inputHandler:  inputHandler,
		frameDuration: time.Second / time.Duration(fps),
	}
}

func (g *Gateway) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "websocket upgrade failed", http.StatusBadRequest)
		return
	}
	defer conn.Close()

	peerConnection, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Printf("peer connection create error: %v", err)
		return
	}
	defer func() {
		_ = peerConnection.Close()
	}()

	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeH264},
		"video",
		"digao-cloud-gaming",
	)
	if err != nil {
		log.Printf("video track create error: %v", err)
		return
	}

	rtpSender, err := peerConnection.AddTrack(videoTrack)
	if err != nil {
		log.Printf("add track error: %v", err)
		return
	}

	go func() {
		rtcpBuffer := make([]byte, 1500)
		for {
			if _, _, readErr := rtpSender.Read(rtcpBuffer); readErr != nil {
				if readErr != io.EOF {
					log.Printf("rtcp read error: %v", readErr)
				}
				return
			}
		}
	}()

	peerConnection.OnDataChannel(func(channel *webrtc.DataChannel) {
		channel.OnMessage(func(message webrtc.DataChannelMessage) {
			g.inputHandler.Handle(message.Data)
		})
	})

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	var writeMu sync.Mutex
	sendSignal := func(message signalMessage) error {
		writeMu.Lock()
		defer writeMu.Unlock()
		return conn.WriteJSON(message)
	}

	peerConnection.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}
		candidateJSON := candidate.ToJSON()
		if err := sendSignal(signalMessage{Type: "candidate", Candidate: &candidateJSON}); err != nil {
			log.Printf("send candidate error: %v", err)
		}
	})

	peerConnection.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("peer state: %s", state.String())
		if state == webrtc.PeerConnectionStateFailed || state == webrtc.PeerConnectionStateClosed {
			cancel()
		}
	})

	streamSub := g.streamSource.Subscribe(ctx, 128)
	go g.writeFrames(ctx, videoTrack, streamSub)

	for {
		_, payload, readErr := conn.ReadMessage()
		if readErr != nil {
			if websocket.IsUnexpectedCloseError(readErr, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket read error: %v", readErr)
			}
			return
		}

		var signal signalMessage
		if err := json.Unmarshal(payload, &signal); err != nil {
			log.Printf("signal parse error: %v", err)
			continue
		}

		switch signal.Type {
		case "offer":
			offer := webrtc.SessionDescription{Type: webrtc.SDPTypeOffer, SDP: signal.SDP}
			if err := peerConnection.SetRemoteDescription(offer); err != nil {
				log.Printf("set remote description error: %v", err)
				continue
			}

			answer, answerErr := peerConnection.CreateAnswer(nil)
			if answerErr != nil {
				log.Printf("create answer error: %v", answerErr)
				continue
			}

			if err := peerConnection.SetLocalDescription(answer); err != nil {
				log.Printf("set local description error: %v", err)
				continue
			}

			if err := sendSignal(signalMessage{Type: "answer", SDP: answer.SDP}); err != nil {
				log.Printf("send answer error: %v", err)
				return
			}
		case "candidate":
			if signal.Candidate == nil {
				continue
			}
			if err := peerConnection.AddICECandidate(*signal.Candidate); err != nil {
				log.Printf("add ice candidate error: %v", err)
			}
		case "input":
			g.inputHandler.Handle(payload)
		default:
			log.Printf("unknown signal type: %s", signal.Type)
		}
	}
}

func (g *Gateway) writeFrames(ctx context.Context, track *webrtc.TrackLocalStaticSample, streamSub <-chan []byte) {
	for {
		select {
		case <-ctx.Done():
			return
		case frame, ok := <-streamSub:
			if !ok {
				return
			}
			if len(frame) == 0 {
				continue
			}
			if err := track.WriteSample(media.Sample{Data: frame, Duration: g.frameDuration}); err != nil {
				log.Printf("write sample error: %v", err)
				return
			}
		}
	}
}
