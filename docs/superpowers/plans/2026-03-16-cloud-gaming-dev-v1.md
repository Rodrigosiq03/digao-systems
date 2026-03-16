# Cloud Gaming Dev V1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing cloud-gaming MVP into a dev-only product that uses the Go hub for auth/catalog/session orchestration and Sunshine as the streaming provider, with manual Steam and RPCS3 catalog entries and no browser play.

**Architecture:** Keep the Go backend as the system of record for sessions, but decouple it from the built-in WebRTC path when the active stream provider is Sunshine. Replace the current flat string catalog with a file-backed manual catalog that can express platform, provider, enabled state, and launcher metadata. Push platform-specific launch details into host-side wrapper scripts so the hub stays product-centric instead of shell-centric.

**Tech Stack:** Go, embedded static frontend, bash host launchers, Sunshine, oauth2-proxy, Keycloak

---

## File Structure

### Backend config and catalog
- Modify: `services/go/cloud-gaming/internal/config/config.go`
  - Add config for stream provider selection and file-backed catalog loading.
- Modify: `services/go/cloud-gaming/internal/hub/catalog.go`
  - Expand the catalog model to support provider/platform metadata and file loading.
- Modify: `services/go/cloud-gaming/internal/hub/catalog_test.go`
  - Add file-backed catalog and enabled/disabled item coverage.
- Modify: `services/go/cloud-gaming/internal/hub/session_manager.go`
  - Persist provider metadata in sessions and keep one-session host gating.
- Modify: `services/go/cloud-gaming/internal/hub/session_manager_test.go`
  - Cover provider metadata and existing launch-prefix behavior.

### Backend app and HTTP surface
- Modify: `services/go/cloud-gaming/internal/app/app.go`
  - Skip WebRTC/IPC startup when `STREAM_PROVIDER=sunshine`.
- Modify: `services/go/cloud-gaming/internal/app/http_handlers.go`
  - Return provider/session metadata and remove assumptions that a WebRTC stream is always available.
- Modify: `services/go/cloud-gaming/internal/httpserver/router.go`
  - Keep `/ws` optional and avoid registering it in Sunshine mode.

### Frontend hub
- Modify: `services/go/cloud-gaming/web/static/index.html`
  - Remove the implicit browser-stream UX and replace it with provider/session messaging.
- Modify: `services/go/cloud-gaming/web/static/app.js`
  - Remove auto-connect WebRTC assumptions for Sunshine sessions and surface provider-specific status.

### Host launchers and deploy assets
- Create: `deploy/cloud-gaming/host/start-steam-game.sh`
  - Resolve approved Steam IDs into stable Steam launch commands.
- Create: `deploy/cloud-gaming/host/start-rpcs3-game.sh`
  - Resolve approved RPCS3 directories under `/lexar/games` into a stable RPCS3 launch command.
- Modify: `deploy/cloud-gaming/host/cloud-gaming.host.env.example`
  - Point the host mode to the dev v1 catalog file and Sunshine provider mode.
- Create: `deploy/cloud-gaming/host/catalog.dev-v1.json`
  - Manual catalog definition for Steam, RPCS3, and disabled Ryujinx placeholders.
- Modify: `deploy/cloud-gaming/host/README.md`
  - Document the new dev v1 flow and host prerequisites.

---

## Chunk 1: Backend Catalog and Session Model

### Task 1: Introduce a file-backed dev v1 catalog model

**Files:**
- Modify: `services/go/cloud-gaming/internal/config/config.go`
- Modify: `services/go/cloud-gaming/internal/hub/catalog.go`
- Test: `services/go/cloud-gaming/internal/hub/catalog_test.go`
- Fixture: `deploy/cloud-gaming/host/catalog.dev-v1.json`

- [ ] **Step 1: Write the failing catalog tests**

```go
func TestLoadCatalogFileSkipsDisabledEntries(t *testing.T) {
	path := filepath.Join("testdata", "catalog.dev-v1.json")
	games, err := LoadCatalog(path, "")
	if err != nil {
		t.Fatalf("LoadCatalog returned error: %v", err)
	}

	if len(games) != 3 {
		t.Fatalf("expected 3 enabled games, got %d", len(games))
	}
}

func TestLoadCatalogFilePreservesPlatformAndProvider(t *testing.T) {
	path := filepath.Join("testdata", "catalog.dev-v1.json")
	games, err := LoadCatalog(path, "")
	if err != nil {
		t.Fatalf("LoadCatalog returned error: %v", err)
	}

	if games[0].Platform == "" || games[0].StreamProvider == "" {
		t.Fatalf("expected platform and provider metadata")
	}
}
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `cd services/go/cloud-gaming && go test ./internal/hub -run 'TestLoadCatalogFile' -v`
Expected: FAIL because `LoadCatalog` and the richer metadata do not exist yet.

- [ ] **Step 3: Add the minimal backend catalog changes**

Implement:
- `Config.GameCatalogFile string`
- `LoadCatalog(filePath, rawEnv string) ([]Game, error)` in `catalog.go`
- richer `Game` fields:

```go
type Game struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Platform       string `json:"platform"`
	StreamProvider string `json:"streamProvider"`
	Command        string `json:"-"`
	StopCommand    string `json:"-"`
}
```

Rules:
- if `GAME_CATALOG_FILE` is set, load JSON from file
- disabled entries stay in file but are not returned to the active catalog
- fallback to current `GAME_CATALOG` string parser to avoid breaking older setups

- [ ] **Step 4: Add the dev v1 catalog fixture**

Create `deploy/cloud-gaming/host/catalog.dev-v1.json` with entries like:

```json
[
  {
    "id": "weed-shop-3",
    "name": "Weed Shop 3",
    "description": "Steam",
    "platform": "steam",
    "streamProvider": "sunshine",
    "enabled": true,
    "command": "/data/apps/deploy/cloud-gaming/host/start-steam-game.sh weed-shop-3"
  }
]
```

Include:
- `weed-shop-3`
- `schedule-i`
- one RPCS3 title from `/lexar/games`
- one disabled Ryujinx placeholder entry

- [ ] **Step 5: Run the tests again**

Run: `cd services/go/cloud-gaming && go test ./internal/hub -run 'TestLoadCatalogFile|TestParseCatalog' -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/go/cloud-gaming/internal/config/config.go \
        services/go/cloud-gaming/internal/hub/catalog.go \
        services/go/cloud-gaming/internal/hub/catalog_test.go \
        deploy/cloud-gaming/host/catalog.dev-v1.json
git commit -m "feat(cloud-gaming): add file-backed dev catalog"
```

### Task 2: Persist provider metadata in sessions and stop assuming WebRTC is always active

**Files:**
- Modify: `services/go/cloud-gaming/internal/hub/session_manager.go`
- Modify: `services/go/cloud-gaming/internal/hub/session_manager_test.go`
- Modify: `services/go/cloud-gaming/internal/app/app.go`
- Modify: `services/go/cloud-gaming/internal/app/http_handlers.go`
- Modify: `services/go/cloud-gaming/internal/httpserver/router.go`

- [ ] **Step 1: Write the failing session tests**

```go
func TestStartSessionCarriesStreamProvider(t *testing.T) {
	manager := NewSessionManager(1, "noop", "/bin/bash", "", true, []Game{
		{ID: "weed-shop-3", Name: "Weed Shop 3", Platform: "steam", StreamProvider: "sunshine", Command: "true"},
	})

	session, err := manager.StartSession(UserIdentity{ID: "u1", Username: "u1"}, "weed-shop-3")
	if err != nil {
		t.Fatalf("StartSession returned error: %v", err)
	}

	if session.StreamProvider != "sunshine" {
		t.Fatalf("expected sunshine provider, got %q", session.StreamProvider)
	}
}
```

- [ ] **Step 2: Run the session test to verify it fails**

Run: `cd services/go/cloud-gaming && go test ./internal/hub -run TestStartSessionCarriesStreamProvider -v`
Expected: FAIL because `Session.StreamProvider` does not exist yet.

- [ ] **Step 3: Extend session metadata and HTTP responses**

Add at minimum:

```go
type Session struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	Username       string    `json:"username"`
	GameID         string    `json:"gameId"`
	GameName       string    `json:"gameName"`
	Platform       string    `json:"platform"`
	StreamProvider string    `json:"streamProvider"`
	StartedAt      time.Time `json:"startedAt"`
}
```

Update `/api/hub` to include:
- `games` with platform/provider metadata
- `userSession` containing provider metadata
- `stream` block describing current backend mode, e.g.:

```json
{
  "provider": "sunshine",
  "browserPlayable": false
}
```

- [ ] **Step 4: Gate WebRTC startup in `app.go`**

Implement:
- if `STREAM_PROVIDER=sunshine`, do not create `streamBroker`, `ipcReceiver`, `inputHandler`, or `gateway`
- do not register `/ws` in Sunshine mode
- keep current WebRTC path intact for future fallback/testing modes

- [ ] **Step 5: Run the backend tests**

Run:
- `cd services/go/cloud-gaming && go test ./internal/hub -v`
- `cd services/go/cloud-gaming && go test ./internal/app ./internal/httpserver -v`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/go/cloud-gaming/internal/hub/session_manager.go \
        services/go/cloud-gaming/internal/hub/session_manager_test.go \
        services/go/cloud-gaming/internal/app/app.go \
        services/go/cloud-gaming/internal/app/http_handlers.go \
        services/go/cloud-gaming/internal/httpserver/router.go
git commit -m "feat(cloud-gaming): model sunshine-backed sessions"
```

---

## Chunk 2: Frontend UX and Host Launchers

### Task 3: Rework the hub UI for Sunshine sessions instead of browser streaming

**Files:**
- Modify: `services/go/cloud-gaming/web/static/index.html`
- Modify: `services/go/cloud-gaming/web/static/app.js`

- [ ] **Step 1: Write a simple manual UX checklist before code**

Create a checklist in the task notes:
- no visible promise of browser play
- active session shows provider and platform
- old `Conectar stream` flow is hidden or disabled for Sunshine
- stop session remains available

- [ ] **Step 2: Update the HTML structure**

Replace the streaming-oriented panel with a session/provider panel. The right side should become a status/instructions area instead of a `<video>`-centric layout.

Minimal target shape:

```html
<section class="provider-container">
  <div id="provider-status">provider: pending</div>
  <div id="provider-instructions">Selecione um jogo para iniciar uma sessao.</div>
</section>
```

- [ ] **Step 3: Update the client logic**

In `app.js`:
- stop creating WebRTC connections when `hub.stream.provider === "sunshine"`
- remove or disable `connectStreamButton` in Sunshine mode
- render game cards with platform/provider badges
- render session details with provider-specific copy

Expected behavior:
- `grafana`-style auth remains unchanged
- starting a session refreshes the hub and shows `sunshine` as the active provider
- no JS errors if `/ws` does not exist

- [ ] **Step 4: Manually verify the frontend locally**

Run:
```bash
cd services/go/cloud-gaming
go test ./web/... ./internal/app ./internal/httpserver
```

Then load the hub manually and verify:
- the old video-focused layout is gone
- no `Conectar stream` action is offered for Sunshine sessions

- [ ] **Step 5: Commit**

```bash
git add services/go/cloud-gaming/web/static/index.html \
        services/go/cloud-gaming/web/static/app.js
git commit -m "feat(cloud-gaming): adapt hub ui for sunshine sessions"
```

### Task 4: Add host launchers for Steam and RPCS3 and wire the dev v1 env

**Files:**
- Create: `deploy/cloud-gaming/host/start-steam-game.sh`
- Create: `deploy/cloud-gaming/host/start-rpcs3-game.sh`
- Modify: `deploy/cloud-gaming/host/cloud-gaming.host.env.example`
- Modify: `deploy/cloud-gaming/host/README.md`

- [ ] **Step 1: Write the shell contract as comments and usage output**

For `start-steam-game.sh`:
- accept a stable catalog ID such as `weed-shop-3`
- map to a known Steam app launch command
- fail hard on unknown IDs

For `start-rpcs3-game.sh`:
- accept a stable catalog ID or exact approved path alias
- map to a known directory under `/lexar/games`
- fail hard if directory does not exist

- [ ] **Step 2: Implement `start-steam-game.sh`**

Minimal pattern:

```bash
case "${1:-}" in
  weed-shop-3) exec steam -applaunch 1182110 ;;
  schedule-i) exec steam -applaunch <REAL_APP_ID> ;;
  *) echo "[ERR] unknown steam game id: $1" >&2; exit 1 ;;
esac
```

- [ ] **Step 3: Implement `start-rpcs3-game.sh`**

Use a strict mapping, for example:

```bash
case "${1:-}" in
  god-of-war-iii) game_dir="/lexar/games/God of War III" ;;
  *) echo "[ERR] unknown rpcs3 game id: $1" >&2; exit 1 ;;
esac

exec rpcs3 --no-gui "$game_dir"
```

Adjust the exact RPCS3 invocation to match the installed binary/flags on the host.

- [ ] **Step 4: Update host env and docs**

In `cloud-gaming.host.env.example`:
- set `STREAM_PROVIDER=sunshine`
- set `GAME_CATALOG_FILE=/data/apps/deploy/cloud-gaming/host/catalog.dev-v1.json`
- remove the old sample `GAME_CATALOG` line from the primary path

In `README.md`:
- document the new dev v1 flow
- explain that Sunshine is the active stream provider
- explain that the backend no longer provides browser play in this mode

- [ ] **Step 5: Validate the scripts**

Run:
```bash
bash -n deploy/cloud-gaming/host/start-steam-game.sh
bash -n deploy/cloud-gaming/host/start-rpcs3-game.sh
```

And manually dry-run the help/usage paths:
```bash
deploy/cloud-gaming/host/start-steam-game.sh unknown || true
deploy/cloud-gaming/host/start-rpcs3-game.sh unknown || true
```

- [ ] **Step 6: Commit**

```bash
git add deploy/cloud-gaming/host/start-steam-game.sh \
        deploy/cloud-gaming/host/start-rpcs3-game.sh \
        deploy/cloud-gaming/host/cloud-gaming.host.env.example \
        deploy/cloud-gaming/host/README.md
git commit -m "feat(cloud-gaming): add sunshine host launchers"
```

### Task 5: End-to-end dev validation and deployment notes

**Files:**
- Modify: `services/go/cloud-gaming/README.md`
- Modify: `deploy/cloud-gaming/host/README.md`

- [ ] **Step 1: Update backend README**

Document:
- Sunshine-backed mode
- `STREAM_PROVIDER`
- `GAME_CATALOG_FILE`
- the fact that `/ws` is not part of the dev v1 Sunshine flow

- [ ] **Step 2: Create the manual validation checklist in docs**

Add a short section covering:
- login through the hub
- start `Weed Shop 3`
- stop session
- start one RPCS3 title
- verify Ryujinx remains hidden/disabled

- [ ] **Step 3: Run the full targeted verification**

Run:
```bash
cd services/go/cloud-gaming
go test ./internal/hub ./internal/app ./internal/httpserver -v
bash -n /data/apps/deploy/cloud-gaming/host/start-steam-game.sh
bash -n /data/apps/deploy/cloud-gaming/host/start-rpcs3-game.sh
```

Then perform the host manual checks from the validation checklist.

- [ ] **Step 4: Commit**

```bash
git add services/go/cloud-gaming/README.md \
        deploy/cloud-gaming/host/README.md
git commit -m "docs(cloud-gaming): document sunshine dev flow"
```
