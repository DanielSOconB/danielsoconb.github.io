// envelope.js: vídeo full-screen → flash blanco → mostrar web + “camino” serpenteante que se dibuja con el scroll
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

  // Fondo "camino"
  const svg         = document.getElementById("pathLayer");
  const path        = document.getElementById("pathTrail");
  const dot         = document.getElementById("pathDot");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = false;
  let pathLen = 0;
  let rafId   = 0;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ===== Guest / contenido ===== */
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

  /* ===== Aparición web ===== */
  function showSiteInstant() {
    stage?.classList.add("is-done");
    site?.classList.add("site--visible");
    site?.setAttribute("aria-hidden", "false");
    body.classList.remove("no-scroll");
    initPath(); startReveals();
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
    initPath(); startReveals();
  }

  /* ===== Vídeo ===== */
  async function startVideo() {
    if (started) return;
    started = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
    } catch {
      if (mount) mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba más tarde.</p>`;
    }

    if (reduceMotion) { showSiteInstant(); return; }

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

  /* ===== Camino serpenteante ===== */

  function docH() { return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight); }
  function vw() { return document.documentElement.clientWidth; }

  function computeAnchors() {
    // puntos: hero, cada .story y la sección .rsvp
    const anchors = [];
    const hero = document.querySelector(".hero");
    if (hero) {
      const r = hero.getBoundingClientRect();
      anchors.push({ xSide: 0.5, y: r.top + window.scrollY + r.height*0.5 });
    }

    const stories = Array.from(document.querySelectorAll(".story"));
    stories.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      const side = sec.classList.contains("right") ? 0.80 : 0.20; // 20% izq, 80% dcha
      anchors.push({ xSide: side, y: r.top + window.scrollY + r.height*0.5 });
    });

    const rsvp = document.querySelector(".rsvp");
    if (rsvp) {
      const r = rsvp.getBoundingClientRect();
      anchors.push({ xSide: 0.5, y: r.top + window.scrollY + r.height*0.5 });
    }
    return anchors;
  }

  function buildPath(points) {
    // Convierte anchors (xSide,y) a coords en el SVG de página completa
    const W = vw();
    const margin = Math.min(120, W * 0.08);
    const leftX  = margin + W * 0.18;
    const rightX = W - margin - W * 0.18;

    const coords = points.map(p => {
      const x = (typeof p.xSide === "number")
        ? (p.xSide <= 0.5 ? leftX : rightX)
        : (W * 0.5);
      return { x, y: p.y };
    });

    if (coords.length < 2) return "";

    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i=1; i<coords.length; i++) {
      const p0 = coords[i-1], p1 = coords[i];
      const dy = (p1.y - p0.y);
      const c1 = { x: p0.x, y: p0.y + dy*0.45 };
      const c2 = { x: p1.x, y: p1.y - dy*0.45 };
      d += ` C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`;
    }
    return d;
  }

  function resizeSvgToDoc() {
    if (!svg) return;
    const H = docH();
    const W = vw();
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  function initPath() {
    if (!svg || !path) return;
    cancelAnimationFrame(rafId);

    // Ajusta el SVG al documento
    resizeSvgToDoc();

    // Recalcula anchors y path
    const anchors = computeAnchors();
    const d = buildPath(anchors);
    path.setAttribute("d", d);

    // Longitud y dash
    try {
      pathLen = path.getTotalLength();
    } catch { pathLen = 0; }
    path.style.strokeDasharray = `${pathLen}`;
    path.style.strokeDashoffset = `${pathLen}`;

    // Mueve el dot al inicio
    if (dot && pathLen > 0) {
      const p0 = path.getPointAtLength(0);
      dot.setAttribute("cx", p0.x);
      dot.setAttribute("cy", p0.y);
    }

    // Scroll handler (reveal y “viaje” del punto)
    onScroll();
  }

  function onScroll() {
    if (!pathLen) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const prog = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    const visible = pathLen * prog;

    path.style.strokeDashoffset = `${pathLen - visible}`;

    if (dot) {
      const p = path.getPointAtLength(visible);
      dot.setAttribute("cx", p.x);
      dot.setAttribute("cy", p.y);
    }
  }

  function debounce(fn, ms=100){
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  window.addEventListener("scroll", () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(onScroll); }, { passive: true });
  window.addEventListener("resize", debounce(initPath, 120));

  // Recalcula tras cargar imágenes (cambian alturas)
  window.addEventListener("load", () => setTimeout(initPath, 60));
  document.addEventListener("DOMContentLoaded", () => {
    const imgs = document.querySelectorAll("img[loading='lazy'], img");
    let pending = imgs.length;
    if (!pending) return;
    imgs.forEach(img => img.addEventListener("load", () => { if (--pending === 0) initPath(); }, { once:true }));
  });

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
