package stream

import "context"

// Source exposes frame subscriptions for streaming transport layers.
type Source interface {
	Subscribe(ctx context.Context, buffer int) <-chan []byte
}

// Publisher ingests encoded frames from external producers.
type Publisher interface {
	Publish(frame []byte)
}
