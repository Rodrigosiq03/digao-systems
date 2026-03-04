package stream

import (
	"context"
	"sync"
)

type Broker struct {
	mu     sync.RWMutex
	nextID int
	subs   map[int]chan []byte
}

func NewBroker() *Broker {
	return &Broker{
		subs: make(map[int]chan []byte),
	}
}

func (b *Broker) Publish(frame []byte) {
	if len(frame) == 0 {
		return
	}

	b.mu.RLock()
	defer b.mu.RUnlock()

	for _, ch := range b.subs {
		payload := make([]byte, len(frame))
		copy(payload, frame)
		select {
		case ch <- payload:
		default:
		}
	}
}

func (b *Broker) Subscribe(ctx context.Context, buffer int) <-chan []byte {
	if buffer <= 0 {
		buffer = 64
	}

	ch := make(chan []byte, buffer)

	b.mu.Lock()
	id := b.nextID
	b.nextID++
	b.subs[id] = ch
	b.mu.Unlock()

	go func() {
		<-ctx.Done()
		b.mu.Lock()
		if sub, ok := b.subs[id]; ok {
			delete(b.subs, id)
			close(sub)
		}
		b.mu.Unlock()
	}()

	return ch
}
