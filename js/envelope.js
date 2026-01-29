// envelope.js (ESM): vídeo del sobre → flash blanco → carta con fade-in
import { animate } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene        = document.getElementById("scene");
  const resetBtn     = document.getElementById("resetBtn");
  const stage        = document.querySelector(".envelope-stage");
  const video        = document.getElementById("envelopeVideo");
  const whitefade    = document.querySelector(".whitefade");
  const playBtn      = document.getElementById("videoPlayBtn");
  const skipBtn      = document.getElementById("skipVideoBtn");
  const mount        = document.getElementById("letterMount");   // .letter__inner
  const letterEl     = mount?.parentElement;                      // <section class="letter">
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let started = false;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function renderLetter(g) {
    const venueFull = g.venueCity ? `${g.venueName}, ${g.venueCity}` : g.venueName;
    const extra = g.message ? `<p class="meta">${g.message}</p>` : "";
    mount.innerHTML = `
      <h2 class="title">¡Nos casamos!</h2>
      <p class="who">Hola <strong>${g.displayName}</strong>, nos encantaría que nos acompañaras.</p>
      <p class="meta"><strong>Cuándo:</strong> <span>${g.when || ""}</span></p>
      <p class="meta"><strong>Dónde:</strong> <a href="${g.venueMap}" target="_blank" rel="noopener">${venueFull}</a></p>
      <p class="meta"><strong>Acompañantes permitidos:</strong> <span>${g.plus}</span></p>
      ${extra}
    `;
  }

  function showLetterInstant() {
    if (!letterEl || !mount) return;
    letterEl.style.opacity = "1";
    letterEl.style.transform = "none";
    mount.style.opacity = "1";
    mount.style.filter = "none";
    stage?.classList.add("is-done");
  }

  async function fadeToLetter() {
    // 1) Subir a blanco
    whitefade.style.opacity = "1";
    await wait(260); // breve flash

    // 2) Oculta vídeo
    stage?.classList.add("is-done");

    // 3) Aparece contenido (fade-in)
    if (letterEl && mount) {
      letterEl.style.opacity = "1";
      letterEl.style.transform = "none";
      mount.style.opacity = "0";
      mount.style.filter = "blur(6px)";
      await animate(
        mount,
        { opacity: [0, 1], filter: ["blur(6px)", "blur(0px)"] },
        { duration: 0.28, easing: "ease-out" }
      ).finished;
    }

    // 4) Bajar blanco
    whitefade.style.opacity = "0";
  }

  async function startVideo() {
    if (started) return;
    started = true;

    // Carga datos de invitado
    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
    } catch (e) {
      mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`;
    }

    if (reduceMotion) {
      // Sin vídeo, transición directa
      showLetterInstant();
      return;
    }

    // Reproducción del vídeo
    stage?.classList.add("is-playing");
    try {
      // iOS: usa pointerdown/click; muted + playsinline ayudan
      video.currentTime = 0;
      await video.play();
    } catch (err) {
      // Si falla (autoplay policies), muestra el botón
      playBtn.style.display = "inline-flex";
    }
  }

  function handleEnded() {
    // Al terminar el vídeo: flash blanco y después la carta
    fadeToLetter();
  }

  function skipVideo() {
    try { video.pause(); } catch {}
    showLetterInstant();
  }

  // Eventos de reproducción
  stage?.addEventListener("click", (e) => {
    // Evita que “Saltar” dispare play
    if ((e.target as HTMLElement).id === "skipVideoBtn") return;
    startVideo();
  });
  playBtn?.addEventListener("click", startVideo);
  skipBtn?.addEventListener("click", skipVideo);
  video?.addEventListener("ended", handleEnded);

  // Accesible por teclado
  scene.setAttribute("tabindex", "0");
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startVideo(); }
  });

  // Reset (si lo usas para depurar)
  resetBtn?.addEventListener("click", () => {
    started = false;
    stage?.classList.remove("is-playing", "is-done");
    whitefade.style.opacity = "0";
    if (letterEl) letterEl.style.opacity = "0";
    if (mount) { mount.style.opacity = "0"; mount.style.filter = ""; }
    try { video.pause(); video.currentTime = 0; } catch {}
  });
})();
