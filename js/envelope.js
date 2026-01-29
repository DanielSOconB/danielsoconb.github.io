// envelope.js (ESM): vídeo del sobre a pantalla completa → flash blanco → carta con fade-in
import { animate } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const body        = document.body;
  const stage       = document.querySelector(".envelope-stage");
  const video       = document.getElementById("envelopeVideo");
  const whitefade   = document.querySelector(".whitefade");
  const playBtn     = document.getElementById("videoPlayBtn");
  const skipBtn     = document.getElementById("skipVideoBtn");
  const mount       = document.getElementById("letterMount");   // .letter__inner
  const letterEl    = mount?.parentElement;                      // <section class="letter">
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let started = false;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function renderLetter(g) {
    const venueFull = g.venueCity ? `${g.venueName}, ${g.venueCity}` : g.venueName;
    const extra = g.message ? `<p class="meta">${g.message}</p>` : "";
    mount && (mount.innerHTML = `
      <h2 class="title">¡Nos casamos!</h2>
      <p class="who">Hola <strong>${g.displayName}</strong>, nos encantaría que nos acompañaras.</p>
      <p class="meta"><strong>Cuándo:</strong> <span>${g.when || ""}</span></p>
      <p class="meta"><strong>Dónde:</strong> <a href="${g.venueMap}" target="_blank" rel="noopener">${venueFull}</a></p>
      <p class="meta"><strong>Acompañantes permitidos:</strong> <span>${g.plus}</span></p>
      ${extra}
    `);
  }

  function showLetterInstant() {
    if (!letterEl || !mount) return;
    stage?.classList.add("is-done");
    letterEl.style.opacity = "1";
    mount.style.opacity = "1";
    mount.style.filter = "none";
    body.classList.remove("no-scroll");
  }

  async function fadeToLetter() {
    // 1) Flash blanco breve
    whitefade && (whitefade.style.opacity = "1");
    await wait(260);

    // 2) Oculta vídeo (estado final del stage)
    stage?.classList.add("is-done");

    // 3) Aparece la carta con fade-in (blur → nítido)
    if (letterEl && mount) {
      letterEl.style.opacity = "1";
      mount.style.opacity = "0";
      mount.style.filter = "blur(6px)";
      await animate(
        mount,
        { opacity: [0, 1], filter: ["blur(6px)", "blur(0px)"] },
        { duration: 0.28, easing: "ease-out" }
      ).finished;
    }

    // 4) Retira flash y vuelve a permitir scroll (si hay contenido largo)
    whitefade && (whitefade.style.opacity = "0");
    body.classList.remove("no-scroll");
  }

  async function startVideo() {
    if (started) return;
    started = true;

    // Prepara datos del invitado
    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
    } catch {
      mount && (mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`);
    }

    if (reduceMotion) { showLetterInstant(); return; }

    // Estado "reproduciendo" + bloquea scroll
    stage?.classList.add("is-playing");
    body.classList.add("no-scroll");

    // Inicia el vídeo (iOS requiere interacción previa: este click la satisface)
    try {
      if (video) {
        video.currentTime = 0;
        await video.play();
      }
    } catch {
      // Si falla por políticas de autoplay, muestra el botón Abrir
      if (playBtn) playBtn.style.display = "inline-flex";
    }
  }

  function handleEnded() { fadeToLetter(); }
  function skipVideo()   { try { video?.pause(); } catch {} showLetterInstant(); }

  // Eventos
  stage?.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.id === "skipVideoBtn") return; // no iniciar si clican "Saltar"
    startVideo();
  });
  playBtn?.addEventListener("click", startVideo);
  skipBtn?.addEventListener("click", skipVideo);
  video?.addEventListener("ended", handleEnded);

  // Accesible por teclado (usar el propio stage como foco)
  stage?.setAttribute("tabindex", "0");
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startVideo(); }
  });
})();
