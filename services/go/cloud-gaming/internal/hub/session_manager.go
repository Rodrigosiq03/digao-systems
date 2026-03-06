package hub

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	ErrGameNotFound      = errors.New("game not found")
	ErrCapacityReached   = errors.New("max concurrent sessions reached")
	ErrUserAlreadyActive = errors.New("user already has an active session")
	ErrNoActiveSession   = errors.New("user does not have active session")
)

type UserIdentity struct {
	ID       string
	Username string
}

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Username  string    `json:"username"`
	GameID    string    `json:"gameId"`
	GameName  string    `json:"gameName"`
	StartedAt time.Time `json:"startedAt"`
}

type managedSession struct {
	data   Session
	cancel context.CancelFunc
	cmd    *exec.Cmd
}

type SessionManager struct {
	mu sync.RWMutex

	maxConcurrent int
	launchMode    string
	shell         string
	games         map[string]Game
	sessions      map[string]*managedSession
	userSessions  map[string]string
}

func NewSessionManager(maxConcurrent int, launchMode, shell string, games []Game) *SessionManager {
	if maxConcurrent <= 0 {
		maxConcurrent = 1
	}
	if launchMode == "" {
		launchMode = "noop"
	}
	if shell == "" {
		shell = "/bin/bash"
	}

	gameMap := make(map[string]Game, len(games))
	for _, game := range games {
		gameMap[game.ID] = game
	}

	return &SessionManager{
		maxConcurrent: maxConcurrent,
		launchMode:    launchMode,
		shell:         shell,
		games:         gameMap,
		sessions:      map[string]*managedSession{},
		userSessions:  map[string]string{},
	}
}

func (m *SessionManager) MaxConcurrent() int {
	return m.maxConcurrent
}

func (m *SessionManager) ListGames() []Game {
	m.mu.RLock()
	defer m.mu.RUnlock()

	values := make([]Game, 0, len(m.games))
	for _, game := range m.games {
		values = append(values, game)
	}
	sort.Slice(values, func(i, j int) bool {
		return values[i].Name < values[j].Name
	})
	return values
}

func (m *SessionManager) StartSession(user UserIdentity, gameID string) (Session, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.userSessions[user.ID]; ok {
		return Session{}, ErrUserAlreadyActive
	}
	if len(m.sessions) >= m.maxConcurrent {
		return Session{}, ErrCapacityReached
	}

	game, ok := m.games[gameID]
	if !ok {
		return Session{}, ErrGameNotFound
	}

	session := Session{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		Username:  user.Username,
		GameID:    game.ID,
		GameName:  game.Name,
		StartedAt: time.Now().UTC(),
	}

	current := &managedSession{data: session}

	if m.launchMode == "exec" {
		ctx, cancel := context.WithCancel(context.Background())
		cmd := exec.CommandContext(ctx, m.shell, "-lc", game.Command)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			cancel()
			return Session{}, fmt.Errorf("start game command: %w", err)
		}

		current.cancel = cancel
		current.cmd = cmd
		go m.watchCommand(session.ID, cmd)
	}

	m.sessions[session.ID] = current
	m.userSessions[user.ID] = session.ID

	return session, nil
}

func (m *SessionManager) StopSessionForUser(userID string) (Session, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	sessionID, ok := m.userSessions[userID]
	if !ok {
		return Session{}, ErrNoActiveSession
	}
	return m.stopSessionLocked(sessionID)
}

func (m *SessionManager) GetSessionForUser(userID string) (Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sessionID, ok := m.userSessions[userID]
	if !ok {
		return Session{}, false
	}
	current, ok := m.sessions[sessionID]
	if !ok {
		return Session{}, false
	}
	return current.data, true
}

func (m *SessionManager) ListActiveSessions() []Session {
	m.mu.RLock()
	defer m.mu.RUnlock()

	out := make([]Session, 0, len(m.sessions))
	for _, current := range m.sessions {
		out = append(out, current.data)
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].StartedAt.Before(out[j].StartedAt)
	})
	return out
}

func (m *SessionManager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id := range m.sessions {
		_, _ = m.stopSessionLocked(id)
	}
}

func (m *SessionManager) stopSessionLocked(sessionID string) (Session, error) {
	current, ok := m.sessions[sessionID]
	if !ok {
		return Session{}, ErrNoActiveSession
	}

	if current.cancel != nil {
		current.cancel()
	}
	if current.cmd != nil && current.cmd.Process != nil {
		_ = current.cmd.Process.Kill()
	}

	delete(m.sessions, sessionID)
	delete(m.userSessions, current.data.UserID)

	return current.data, nil
}

func (m *SessionManager) watchCommand(sessionID string, cmd *exec.Cmd) {
	err := cmd.Wait()
	if err != nil {
		log.Printf("game process exited with error (session=%s): %v", sessionID, err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	current, ok := m.sessions[sessionID]
	if !ok {
		return
	}
	delete(m.sessions, sessionID)
	delete(m.userSessions, current.data.UserID)
}
