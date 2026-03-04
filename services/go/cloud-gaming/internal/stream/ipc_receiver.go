package stream

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"
	"sync"
)

type IPCReceiver struct {
	socketPath string
	broker     *Broker
}

func NewIPCReceiver(socketPath string, broker *Broker) *IPCReceiver {
	return &IPCReceiver{
		socketPath: socketPath,
		broker:     broker,
	}
}

func (r *IPCReceiver) Run(ctx context.Context) error {
	if err := os.MkdirAll(filepath.Dir(r.socketPath), 0o755); err != nil {
		return err
	}
	_ = os.Remove(r.socketPath)

	listener, err := net.Listen("unix", r.socketPath)
	if err != nil {
		return err
	}
	defer func() {
		_ = listener.Close()
		_ = os.Remove(r.socketPath)
	}()

	var wg sync.WaitGroup
	go func() {
		<-ctx.Done()
		_ = listener.Close()
	}()

	for {
		conn, acceptErr := listener.Accept()
		if acceptErr != nil {
			if ctx.Err() != nil || errors.Is(acceptErr, net.ErrClosed) {
				break
			}
			log.Printf("ipc accept error: %v", acceptErr)
			continue
		}

		wg.Add(1)
		go func(c net.Conn) {
			defer wg.Done()
			defer c.Close()
			r.handleConn(ctx, c)
		}(conn)
	}

	wg.Wait()
	return nil
}

func (r *IPCReceiver) handleConn(ctx context.Context, conn net.Conn) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		var rawSize [4]byte
		if _, err := io.ReadFull(conn, rawSize[:]); err != nil {
			if !errors.Is(err, io.EOF) {
				log.Printf("ipc read size error: %v", err)
			}
			return
		}

		size := binary.BigEndian.Uint32(rawSize[:])
		if size == 0 {
			continue
		}

		payload := make([]byte, size)
		if _, err := io.ReadFull(conn, payload); err != nil {
			log.Printf("ipc read payload error: %v", err)
			return
		}

		r.broker.Publish(payload)
	}
}
