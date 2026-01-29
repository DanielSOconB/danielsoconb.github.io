// envelope.js (ESM): vídeo full-screen → flash blanco → mostrar web normal (scrollable)
import { animate } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const body        = document.body;
  const stage       = document.querySelector(".envelope-stage");
  const video       = document.getElementById("envelopeVideo");
  const whitefade   = document.querySelector(".whitefade");
  const playBtn     = document.getElementById("videoPlayBtn");
  const skipBtn     = document.getElementById("skipVideoBtn");
  const site        = document.getElementById("site");
  const mount       = document.getElementById("letterMount"); // contenedor de la tarjeta

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = false;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Rellena la tarjeta con datos del invitado y enlaza el mapa
  function renderLetter(g) {
    const venueFull = g.venueCity ? `${g.venueName}, ${g.venueCity}` : g.venueName;
    const extra = g.message ? `<p class="meta">${g.message}</p>` : "";
    const html = `
      <h2 class="title">¡Nos casamos!</h2>
      <p class="who">Hola <strong>${g.displayName}</strong>, nos encantaría que nos acompañaras.</p>
      <p class="meta"><strong>Cuándo:</strong> <span>${g.when || ""}</span></p>
      <p class="meta"><strong>Dónde:</strong> <a id="mapLinkInner" href="${g.venueMap}" target="_blank" rel="noopener">${venueFull}</a></p>
      <p class="meta"><strong>Acompañantes permitidos:</strong> <span>${g.plus}</span></p>
      ${extra}
    `;
    if (mount) mount.innerHTML = html;

    // También actualiza el CTA de mapa del footer si existe
    const mapLink = document.getElementById("mapLink");
    if (mapLink && g.venueMap) mapLink.href = g.venueMap;
  }

  function showSiteInstant() {
    // Oculta el stage y muestra la web sin animaciones
    stage?.classList.add("is-done");
    site?.classList.add("site--visible");
    site?.setAttribute("aria-hidden", "false");
    body.classList.remove("no-scroll");
  }

  async function fadeToSite() {
    // 1) Flash blanco breve
    if (whitefade) whitefade.style.opacity = "1";
    await wait(220);

    // 2) Oculta stage de vídeo
    stage?.classList.add("is-done");

    // 3) Revela la web
    if (site) {
      site.classList.add("site--visible");
      site.setAttribute("aria-hidden", "false");
    }

    // 4) Quita flash y permite scroll
    if (whitefade) whitefade.style.opacity = "0";
    body.classList.remove("no-scroll");
  }

  async function startVideo() {
    if (started) return;
    started = true;

    // Carga datos del invitado
    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
    } catch {
      if (mount) mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba más tarde.</p>`;
    }

    if (reduceMotion) { showSiteInstant(); return; }

    // Estado "reproduciendo" + bloquea scroll
    body.classList.add("no-scroll");

    // Inicia el vídeo (este click satisface la interacción requerida en iOS)
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

  function handleEnded() { fadeToSite(); }
  function skipVideo()   { try { video?.pause(); } catch {} showSiteInstant(); }

  // Eventos
  stage?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.id === "skipVideoBtn") return; // no iniciar si clican "Saltar"
    startVideo();
  });
  playBtn?.addEventListener("click", startVideo);
  skipBtn?.addEventListener("click", skipVideo);
  video?.addEventListener("ended", handleEnded);

  // Accesible por teclado: Enter/Espacio en el stage
  stage?.setAttribute("tabindex", "0");
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startVideo(); }
  });
})();
