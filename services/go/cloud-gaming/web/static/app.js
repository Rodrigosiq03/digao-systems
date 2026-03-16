(() => {
  const tokenInput = document.getElementById("token");
  const saveTokenButton = document.getElementById("save-token");
  const refreshHubButton = document.getElementById("refresh-hub");
  const authStatus = document.getElementById("auth-status");
  const sessionInfo = document.getElementById("session-info");
  const stopSessionButton = document.getElementById("stop-session");
  const gamesContainer = document.getElementById("games");
  const providerStatus = document.getElementById("provider-status");
  const providerInstructions = document.getElementById("provider-instructions");

  const state = {
    token: localStorage.getItem("cloud_gaming_token") || "",
    hub: null,
  };

  tokenInput.value = state.token;

  function setAuthStatus(text) {
    authStatus.textContent = text;
  }

  function setProviderStatus(text) {
    providerStatus.textContent = text;
  }

  function authHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (state.token.trim()) {
      headers.Authorization = `Bearer ${state.token.trim()}`;
    }
    return headers;
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      const message = body?.error || `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return body;
  }

  function renderGames(games = []) {
    if (!Array.isArray(games) || games.length === 0) {
      gamesContainer.innerHTML = `<div class="status">nenhum jogo configurado</div>`;
      return;
    }

    gamesContainer.innerHTML = "";
    games.forEach((game) => {
      const wrapper = document.createElement("article");
      wrapper.className = "game-item";
      wrapper.innerHTML = `
        <div class="game-title">${game.name}</div>
        <div class="game-description">${game.description || ""}</div>
        <div class="pill-row">
          <span class="pill">${game.platform || "unknown"}</span>
          <span class="pill">${game.streamProvider || "webrtc"}</span>
        </div>
        <div style="margin-top:8px">
          <button data-game-id="${game.id}">Iniciar ${game.name}</button>
        </div>
      `;
      const button = wrapper.querySelector("button");
      button.addEventListener("click", () => startSession(game.id));
      gamesContainer.appendChild(wrapper);
    });
  }

  function renderHub() {
    if (!state.hub) {
      sessionInfo.textContent = "hub indisponivel";
      setProviderStatus("provider: indisponivel");
      providerInstructions.textContent = "Nao foi possivel carregar o estado do hub.";
      renderGames([]);
      return;
    }

    const session = state.hub.userSession;
    const stream = state.hub.stream || {};
    const provider = stream.provider || "unknown";
    const browserPlayable = stream.browserPlayable === true;

    if (session) {
      sessionInfo.textContent =
        `ativa: ${session.gameName} | platform=${session.platform || "?"} | provider=${session.streamProvider || provider}`;
      providerInstructions.textContent =
        `A sessao esta ativa no host. O jogo foi lancado com provider ${session.streamProvider || provider}. Neste dev v1 o stream segue fora do navegador.`;
    } else {
      sessionInfo.textContent = "nenhuma sessao ativa";
      providerInstructions.textContent =
        "Selecione um jogo para iniciar uma sessao. O hub reserva o host, lanca o jogo e reflete o provider ativo.";
    }

    setProviderStatus(
      `provider=${provider} | browserPlayable=${browserPlayable ? "yes" : "no"}`
    );

    const limit = state.hub.limits?.maxConcurrentSessions ?? "?";
    const active = Array.isArray(state.hub.activeSessions) ? state.hub.activeSessions.length : 0;
    setAuthStatus(`user=${state.hub.user?.username || "?"} | sessoes ${active}/${limit}`);
    renderGames(state.hub.games);
  }

  async function refreshHub() {
    try {
      state.hub = await apiRequest("/api/hub");
      renderHub();
    } catch (error) {
      setAuthStatus(`hub error: ${error.message}`);
      state.hub = null;
      renderHub();
    }
  }

  async function startSession(gameId) {
    try {
      const created = await apiRequest("/api/sessions/start", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      setProviderStatus(`sessao iniciada: ${created.gameName} | provider=${created.streamProvider || "?"}`);
      await refreshHub();
    } catch (error) {
      setProviderStatus(`falha ao iniciar sessao: ${error.message}`);
    }
  }

  async function stopSession() {
    try {
      await apiRequest("/api/sessions/stop", { method: "POST", body: "{}" });
      setProviderStatus("sessao parada");
      await refreshHub();
    } catch (error) {
      setProviderStatus(`falha ao parar sessao: ${error.message}`);
    }
  }

  saveTokenButton.addEventListener("click", async () => {
    state.token = tokenInput.value.trim();
    localStorage.setItem("cloud_gaming_token", state.token);
    setAuthStatus("token salvo");
    await refreshHub();
  });

  refreshHubButton.addEventListener("click", refreshHub);
  stopSessionButton.addEventListener("click", stopSession);

  refreshHub();
  setProviderStatus("provider: idle");
})();
