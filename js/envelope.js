// vídeo full-screen FIJO → flash blanco → mostrar web normal (scrollable)
// + Parallax del background moviendo sólo la capa de imagen con --bg-y
import { animate } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const body        = document.body;
  const stage       = document.querySelector(".envelope-stage");
  const video       = document.getElementById("envelopeVideo");
  const whitefade   = document.querySelector(".whitefade");
  const playBtn     = document.getElementById("videoPlayBtn");
  const skipBtn     = document.getElementById("skipVideoBtn");
  const site        = document.getElementById("site");
  const mount       = document.getElementById("letterMount");
  const mapLink     = document.getElementById("mapLink");
  const rsvpBtn     = document.getElementById("rsvpBtn");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = false;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  /* ===== Contenido de invitación ===== */
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
    if (mapLink && g.venueMap) mapLink.href = g.venueMap;
    if (rsvpBtn && g.rsvpUrl)  rsvpBtn.href = g.rsvpUrl;
  }

  /* ===== Mostrar web ===== */
  function showSiteInstant() {
    stage?.classList.add("is-done");               // oculta stage fijo
    site?.classList.add("site--visible");
    site?.setAttribute("aria-hidden", "false");
    body.classList.remove("no-scroll");
    startParallax();                                // inicia parallax del fondo
    startReveals();
  }

  async function fadeToSite() {
    if (whitefade) whitefade.style.opacity = "1";
    await wait(220);
    stage?.classList.add("is-done");
    if (site) {
      site.classList.add("site--visible");
      site.setAttribute("aria-hidden", "false");
    }
    if (whitefade) whitefade.style.opacity = "0";
    body.classList.remove("no-scroll");
    startParallax();
    startReveals();
  }

  /* ===== Vídeo fijo ===== */
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

    // Bloquea scroll mientras está el stage fijo encima
    body.classList.add("no-scroll");

    try {
      if (video) {
        video.currentTime = 0;
        await video.play();
      }
    } catch {
      if (playBtn) playBtn.style.display = "inline-flex";
    }
  }

  function handleEnded() { fadeToSite(); }
  function skipVideo()   { try { video?.pause(); } catch {} showSiteInstant(); }

  stage?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.id === "skipVideoBtn") return;
    startVideo();
  });
  playBtn?.addEventListener("click", startVideo);
  skipBtn?.addEventListener("click", skipVideo);
  video?.addEventListener("ended", handleEnded);

  stage?.setAttribute("tabindex", "0");
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startVideo(); }
  });

  /* ===== Parallax del background (sólo capa de imagen) ===== */
  function startParallax() {
    if (reduceMotion) return; // respeta accesibilidad
    let ticking = false;
    const factor = 0.25; // velocidad del fondo (ajusta: 0.15–0.35)

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.round(window.scrollY * factor);
        document.body.style.setProperty("--bg-y", `${y}px`);
        ticking = false;
      });
    }

    // Inicializa con la posición actual
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ===== Reveal on scroll ===== */
  function startReveals() {
    const items = document.querySelectorAll(".reveal-up");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });
    items.forEach(el => io.observe(el));
  }
})();
