package input

import (
	"encoding/json"
	"log"
)

type Handler struct{}

type InputMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Handle(raw []byte) {
	if len(raw) == 0 {
		return
	}

	var message InputMessage
	if err := json.Unmarshal(raw, &message); err != nil {
		log.Printf("input parse error: %v", err)
		return
	}

	if message.Type == "input" {
		log.Printf("input event received: %s", string(message.Payload))
		return
	}

	log.Printf("input message ignored type=%s", message.Type)
}
