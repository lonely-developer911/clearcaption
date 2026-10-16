(() => {
  "use strict";
  const lines = document.getElementById("captionLines");
  const status = document.getElementById("projectorStatus");
  const fullscreenButton = document.getElementById("projectorFullscreen");
  const channel = ("BroadcastChannel" in window) ? new BroadcastChannel("clearcaption-v2") : null;
  let latestPayload = null;

  function render(payload) {
    if (!payload || payload.type !== "caption-update") return;
    latestPayload = payload;
    status.textContent = payload.status || "Live captions";
    document.documentElement.style.setProperty("--caption-size", `${payload.fontSize || 42}px`);
    lines.replaceChildren();
    const recent = Array.isArray(payload.recentLines) ? payload.recentLines.slice(-5) : [];
    const interim = (payload.interimText || "").trim();
    if (!recent.length && !interim) {
      const empty = document.createElement("p");
      empty.className = "projector-empty";
      empty.textContent = "Captions will appear here when the operator starts speaking.";
      lines.appendChild(empty);
      return;
    }
    recent.forEach((text, index) => {
      const line = document.createElement("div");
      line.className = `caption-line ${index === recent.length - 1 && !interim ? "latest" : "old"}`;
      line.textContent = text;
      lines.appendChild(line);
    });
    if (interim) {
      const line = document.createElement("div");
      line.className = "caption-line interim";
      line.textContent = interim;
      lines.appendChild(line);
    }
  }

  if (channel) channel.onmessage = (event) => render(event.data);
  window.addEventListener("storage", (event) => {
    if (event.key === "clearcaption-v2-update" && event.newValue) {
      try { render(JSON.parse(event.newValue)); } catch (_) {}
    }
  });
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { status.textContent = "Use your browser's full-screen control if needed."; }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.textContent = document.fullscreenElement ? "Exit full screen" : "Enter full screen";
  });
  // Ask the controller to send its latest caption state after the display opens.
  try { localStorage.setItem("clearcaption-v2-request", String(Date.now())); } catch (_) {}
})();