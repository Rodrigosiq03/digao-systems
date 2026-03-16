package auth

import (
	"context"
	"net/http/httptest"
	"testing"
)

func TestAuthenticateRequestProxyModeUsesForwardedHeaders(t *testing.T) {
	t.Parallel()

	authenticator, err := NewAuthenticator(context.Background(), Config{Mode: ModeProxy})
	if err != nil {
		t.Fatalf("NewAuthenticator() error = %v", err)
	}

	req := httptest.NewRequest("GET", "/api/hub", nil)
	req.Header.Set("X-Forwarded-User", "rodrigo")
	req.Header.Set("X-Forwarded-Email", "rodrigo@example.com")

	claims, err := authenticator.AuthenticateRequest(req)
	if err != nil {
		t.Fatalf("AuthenticateRequest() error = %v", err)
	}

	if claims.Subject != "rodrigo" {
		t.Fatalf("Subject = %q, want %q", claims.Subject, "rodrigo")
	}
	if claims.Username != "rodrigo" {
		t.Fatalf("Username = %q, want %q", claims.Username, "rodrigo")
	}
	if claims.Email != "rodrigo@example.com" {
		t.Fatalf("Email = %q, want %q", claims.Email, "rodrigo@example.com")
	}
}

func TestAuthenticateRequestProxyModeRequiresForwardedUser(t *testing.T) {
	t.Parallel()

	authenticator, err := NewAuthenticator(context.Background(), Config{Mode: ModeProxy})
	if err != nil {
		t.Fatalf("NewAuthenticator() error = %v", err)
	}

	req := httptest.NewRequest("GET", "/api/hub", nil)

	_, err = authenticator.AuthenticateRequest(req)
	if err != ErrUnauthorized {
		t.Fatalf("AuthenticateRequest() error = %v, want %v", err, ErrUnauthorized)
	}
}
