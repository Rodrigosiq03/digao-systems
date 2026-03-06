package app

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/digao/cloud-gaming/internal/auth"
	"github.com/digao/cloud-gaming/internal/hub"
)

type startSessionRequest struct {
	GameID string `json:"gameId"`
}

type apiError struct {
	Error string `json:"error"`
}

func (a *App) authenticateOrWrite(w http.ResponseWriter, r *http.Request) (auth.Claims, bool) {
	claims, err := a.authenticator.AuthenticateRequest(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, apiError{Error: "unauthorized"})
		return auth.Claims{}, false
	}
	return claims, true
}

func (a *App) handleAuthMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, apiError{Error: "method not allowed"})
		return
	}
	claims, ok := a.authenticateOrWrite(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, claims)
}

func (a *App) handleHub(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, apiError{Error: "method not allowed"})
		return
	}
	claims, ok := a.authenticateOrWrite(w, r)
	if !ok {
		return
	}

	userSession, hasUserSession := a.sessions.GetSessionForUser(claims.Subject)
	response := map[string]any{
		"user": map[string]string{
			"sub":      claims.Subject,
			"username": claims.Username,
			"email":    claims.Email,
		},
		"limits": map[string]int{
			"maxConcurrentSessions": a.sessions.MaxConcurrent(),
		},
		"games":          a.sessions.ListGames(),
		"activeSessions": a.sessions.ListActiveSessions(),
		"userSession":    nil,
	}
	if hasUserSession {
		response["userSession"] = userSession
	}

	writeJSON(w, http.StatusOK, response)
}

func (a *App) handleStartSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiError{Error: "method not allowed"})
		return
	}
	claims, ok := a.authenticateOrWrite(w, r)
	if !ok {
		return
	}

	var req startSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiError{Error: "invalid body"})
		return
	}
	if req.GameID == "" {
		writeJSON(w, http.StatusBadRequest, apiError{Error: "gameId is required"})
		return
	}

	session, err := a.sessions.StartSession(hub.UserIdentity{
		ID:       claims.Subject,
		Username: claims.Username,
	}, req.GameID)
	if err != nil {
		switch {
		case errors.Is(err, hub.ErrGameNotFound):
			writeJSON(w, http.StatusNotFound, apiError{Error: "game not found"})
		case errors.Is(err, hub.ErrCapacityReached):
			writeJSON(w, http.StatusConflict, apiError{Error: "capacity reached"})
		case errors.Is(err, hub.ErrUserAlreadyActive):
			writeJSON(w, http.StatusConflict, apiError{Error: "user already has active session"})
		default:
			writeJSON(w, http.StatusInternalServerError, apiError{Error: "failed to start session"})
		}
		return
	}

	writeJSON(w, http.StatusCreated, session)
}

func (a *App) handleStopSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiError{Error: "method not allowed"})
		return
	}
	claims, ok := a.authenticateOrWrite(w, r)
	if !ok {
		return
	}

	session, err := a.sessions.StopSessionForUser(claims.Subject)
	if err != nil {
		if errors.Is(err, hub.ErrNoActiveSession) {
			writeJSON(w, http.StatusNotFound, apiError{Error: "no active session"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, apiError{Error: "failed to stop session"})
		return
	}

	writeJSON(w, http.StatusOK, session)
}

func (a *App) handleSessionMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, apiError{Error: "method not allowed"})
		return
	}
	claims, ok := a.authenticateOrWrite(w, r)
	if !ok {
		return
	}

	session, found := a.sessions.GetSessionForUser(claims.Subject)
	if !found {
		writeJSON(w, http.StatusNotFound, apiError{Error: "no active session"})
		return
	}
	writeJSON(w, http.StatusOK, session)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
