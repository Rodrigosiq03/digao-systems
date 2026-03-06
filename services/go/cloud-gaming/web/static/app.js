(() => {
  const streamStatus = document.getElementById("stream-status");
  const video = document.getElementById("game-stream");
  const tokenInput = document.getElementById("token");
  const saveTokenButton = document.getElementById("save-token");
  const refreshHubButton = document.getElementById("refresh-hub");
  const authStatus = document.getElementById("auth-status");
  const sessionInfo = document.getElementById("session-info");
  const connectStreamButton = document.getElementById("connect-stream");
  const stopSessionButton = document.getElementById("stop-session");
  const gamesContainer = document.getElementById("games");

  const state = {
    token: localStorage.getItem("cloud_gaming_token") || "",
    hub: null,
  };

  tokenInput.value = state.token;

  let ws = null;
  let pc = null;
  let inputChannel = null;

  let lastMouseSentAt = 0;

  function setStreamStatus(text) {
    streamStatus.textContent = text;
  }

  function setAuthStatus(text) {
    authStatus.textContent = text;
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
    const body = contentType.includes("application/json")
      ? await response.json()
      : null;
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
      renderGames([]);
      return;
    }

    const session = state.hub.userSession;
    if (session) {
      sessionInfo.textContent = `ativa: ${session.gameName} (id=${session.id.slice(0, 8)})`;
    } else {
      sessionInfo.textContent = "nenhuma sessao ativa";
    }

    const limit = state.hub.limits?.maxConcurrentSessions ?? "?";
    const active = Array.isArray(state.hub.activeSessions)
      ? state.hub.activeSessions.length
      : 0;
    setAuthStatus(
      `user=${state.hub.user?.username || "?"} | sessoes ${active}/${limit}`
    );
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
      setStreamStatus(`sessao iniciada: ${created.gameName}`);
      await refreshHub();
    } catch (error) {
      setStreamStatus(`falha ao iniciar sessao: ${error.message}`);
    }
  }

  async function stopSession() {
    try {
      await apiRequest("/api/sessions/stop", { method: "POST", body: "{}" });
      disconnectStream();
      setStreamStatus("sessao parada");
      await refreshHub();
    } catch (error) {
      setStreamStatus(`falha ao parar sessao: ${error.message}`);
    }
  }

  function disconnectStream() {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (inputChannel) {
      inputChannel.close();
      inputChannel = null;
    }
    if (pc) {
      pc.close();
      pc = null;
    }
    video.srcObject = null;
  }

  function sendSignal(payload) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify(payload));
  }

  function sendInput(payload) {
    const data = JSON.stringify({ type: "input", payload });
    if (inputChannel && inputChannel.readyState === "open") {
      inputChannel.send(data);
      return;
    }
    sendSignal({ type: "input", payload });
  }

  function connectStream() {
    if (!state.hub || !state.hub.userSession) {
      setStreamStatus("inicie uma sessao de jogo antes de conectar o stream");
      return;
    }
    disconnectStream();

    pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    inputChannel = pc.createDataChannel("input");

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        video.srcObject = stream;
        setStreamStatus("stream connected");
      }
    };

    pc.onconnectionstatechange = () => {
      setStreamStatus(`peer: ${pc.connectionState}`);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      sendSignal({ type: "candidate", candidate: event.candidate });
    };

    inputChannel.onopen = () => setStreamStatus("datachannel ready");
    inputChannel.onclose = () => setStreamStatus("datachannel closed");

    const wsScheme = location.protocol === "https:" ? "wss" : "ws";
    const wsURL = new URL(`${wsScheme}://${location.host}/ws`);
    if (state.token.trim()) {
      wsURL.searchParams.set("access_token", state.token.trim());
    }

    ws = new WebSocket(wsURL.toString());

    ws.onopen = async () => {
      setStreamStatus("signaling connected");
      try {
        const offer = await pc.createOffer({ offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", sdp: offer.sdp });
      } catch (error) {
        setStreamStatus(`offer error: ${error}`);
      }
    };

    ws.onmessage = async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "answer" && msg.sdp) {
        try {
          await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
        } catch (error) {
          setStreamStatus(`answer error: ${error}`);
        }
        return;
      }

      if (msg.type === "candidate" && msg.candidate) {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch (error) {
          setStreamStatus(`candidate error: ${error}`);
        }
      }
    };

    ws.onerror = () => setStreamStatus("signaling error");
    ws.onclose = () => setStreamStatus("signaling disconnected");
  }

  saveTokenButton.addEventListener("click", async () => {
    state.token = tokenInput.value.trim();
    localStorage.setItem("cloud_gaming_token", state.token);
    setAuthStatus("token salvo");
    await refreshHub();
  });

  refreshHubButton.addEventListener("click", refreshHub);
  connectStreamButton.addEventListener("click", connectStream);
  stopSessionButton.addEventListener("click", stopSession);

  document.addEventListener("keydown", (event) => {
    sendInput({
      kind: "keyboard",
      key: event.key,
      code: event.code,
      action: "down",
    });
  });

  document.addEventListener("keyup", (event) => {
    sendInput({
      kind: "keyboard",
      key: event.key,
      code: event.code,
      action: "up",
    });
  });

  document.addEventListener("click", (event) => {
    sendInput({
      kind: "mouse",
      action: "click",
      button: event.button,
      x: event.clientX,
      y: event.clientY,
    });
  });

  document.addEventListener("mousemove", (event) => {
    const now = performance.now();
    if (now - lastMouseSentAt < 30) {
      return;
    }
    lastMouseSentAt = now;
    sendInput({
      kind: "mouse",
      action: "move",
      x: event.clientX,
      y: event.clientY,
    });
  });

  refreshHub();
  setStreamStatus("stream idle");
})();
