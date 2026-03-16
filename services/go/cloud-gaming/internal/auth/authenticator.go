package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
)

const (
	ModeNone = "none"
	ModeOIDC = "oidc"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
)

type Claims struct {
	Subject  string `json:"sub"`
	Username string `json:"username"`
	Email    string `json:"email,omitempty"`
}

type Config struct {
	Mode         string
	DefaultUser  string
	OIDCIssuer   string
	OIDCClientID string
}

type Authenticator struct {
	mode        string
	defaultUser string
	verifier    *oidc.IDTokenVerifier
}

func NewAuthenticator(ctx context.Context, cfg Config) (*Authenticator, error) {
	mode := strings.TrimSpace(strings.ToLower(cfg.Mode))
	if mode == "" {
		mode = ModeNone
	}

	if mode == ModeNone {
		if cfg.DefaultUser == "" {
			cfg.DefaultUser = "dev-user"
		}
		return &Authenticator{
			mode:        ModeNone,
			defaultUser: cfg.DefaultUser,
		}, nil
	}

	if mode != ModeOIDC {
		return nil, fmt.Errorf("unsupported auth mode: %s", cfg.Mode)
	}

	if cfg.OIDCIssuer == "" {
		return nil, errors.New("OIDC_ISSUER_URL is required when AUTH_MODE=oidc")
	}

	provider, err := oidc.NewProvider(ctx, cfg.OIDCIssuer)
	if err != nil {
		return nil, fmt.Errorf("create oidc provider: %w", err)
	}

	oidcCfg := &oidc.Config{}
	if cfg.OIDCClientID != "" {
		oidcCfg.ClientID = cfg.OIDCClientID
	} else {
		// Dev mode fallback: valida assinatura + issuer, sem aud estrito.
		oidcCfg.SkipClientIDCheck = true
	}

	return &Authenticator{
		mode:     ModeOIDC,
		verifier: provider.Verifier(oidcCfg),
	}, nil
}

func (a *Authenticator) AuthenticateRequest(r *http.Request) (Claims, error) {
	switch a.mode {
	case ModeNone:
		user := strings.TrimSpace(r.Header.Get("X-Dev-User"))
		if user == "" {
			user = a.defaultUser
		}
		return Claims{
			Subject:  user,
			Username: user,
		}, nil
	case ModeOIDC:
		token := extractBearerToken(r)
		if token == "" {
			token = strings.TrimSpace(r.URL.Query().Get("access_token"))
		}
		if token == "" {
			return Claims{}, ErrUnauthorized
		}

		idToken, err := a.verifier.Verify(r.Context(), token)
		if err != nil {
			return Claims{}, ErrUnauthorized
		}

		raw := map[string]any{}
		if err := idToken.Claims(&raw); err != nil {
			return Claims{}, ErrUnauthorized
		}

		sub, _ := raw["sub"].(string)
		if sub == "" {
			return Claims{}, ErrUnauthorized
		}
		username, _ := raw["preferred_username"].(string)
		if username == "" {
			username, _ = raw["name"].(string)
		}
		if username == "" {
			username = sub
		}
		email, _ := raw["email"].(string)

		return Claims{
			Subject:  sub,
			Username: username,
			Email:    email,
		}, nil
	default:
		return Claims{}, ErrUnauthorized
	}
}

func extractBearerToken(r *http.Request) string {
	authz := strings.TrimSpace(r.Header.Get("Authorization"))
	if authz == "" {
		return ""
	}
	parts := strings.SplitN(authz, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
