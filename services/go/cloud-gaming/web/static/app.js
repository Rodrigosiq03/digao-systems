(() => {
  const status = document.getElementById("status");
  const video = document.getElementById("game-stream");

  const wsScheme = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${wsScheme}://${location.host}/ws`);

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const inputChannel = pc.createDataChannel("input");

  let lastMouseSentAt = 0;

  function setStatus(text) {
    status.textContent = text;
  }

  function sendSignal(payload) {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify(payload));
  }

  function sendInput(payload) {
    const data = JSON.stringify({ type: "input", payload });
    if (inputChannel.readyState === "open") {
      inputChannel.send(data);
      return;
    }
    sendSignal({ type: "input", payload });
  }

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      video.srcObject = stream;
      setStatus("stream connected");
    }
  };

  pc.onconnectionstatechange = () => {
    setStatus(`peer: ${pc.connectionState}`);
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }
    sendSignal({ type: "candidate", candidate: event.candidate });
  };

  inputChannel.onopen = () => setStatus("datachannel ready");
  inputChannel.onclose = () => setStatus("datachannel closed");

  ws.onopen = async () => {
    setStatus("signaling connected");
    try {
      const offer = await pc.createOffer({ offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", sdp: offer.sdp });
    } catch (error) {
      setStatus(`offer error: ${error}`);
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
        setStatus(`answer error: ${error}`);
      }
      return;
    }

    if (msg.type === "candidate" && msg.candidate) {
      try {
        await pc.addIceCandidate(msg.candidate);
      } catch (error) {
        setStatus(`candidate error: ${error}`);
      }
    }
  };

  ws.onerror = () => setStatus("signaling error");
  ws.onclose = () => setStatus("signaling disconnected");

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
})();
