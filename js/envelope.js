// js/envelope.js (ESM): sello → flap (lento) → texto (fade-in)
import { animate, spring } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene     = document.getElementById("scene");
  const resetBtn  = document.getElementById("resetBtn");
  const mount     = document.getElementById("letterMount");   // .letter__inner
  const letterEl  = mount?.parentElement;                      // <section class="letter">
  const flap      = document.querySelector(".envelope__flap");
  const seal      = document.querySelector(".seal");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opening = false;

  // --- util audio (usa tus <audio id="clickStart/clickEnd"> si existen) ---
  function play(id, vol = 1) {
    const el = document.getElementById(id);
    if (!el) return;
    try { const a = new Audio(el.currentSrc || el.src); a.volume = Math.max(0, Math.min(1, vol)); a.play(); } catch {}
  }

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

  // 1) SELLO primero
  async function fadeSealFirst() {
    if (!seal) return;
    await animate(seal, { opacity: [1, 0], scale: [1, 0.92] }, { duration: 0.45, easing: "ease-out" }).finished;
  }

  // 2) FLAP más lento + rebote + clics
  async function openFlapSlowWithBounceAndClicks() {
    play("clickStart", 0.55); // despegue
    await animate(
      flap,
      { rotateX: -182 },
      { duration: 1.15, easing: spring({ stiffness: 110, damping: 22 }), transformOrigin: "50% 0%" }
    ).finished;
    await animate(
      flap,
      { rotateX: -178 },
      { duration: 0.45, easing: spring({ stiffness: 160, damping: 26 }) }
    ).finished;
    play("clickEnd", 1.0); // asentado
    await animate(flap, { rotateX: [-178, -176.4, -178] }, { duration: 0.18, easing: "ease-out" }).finished;
  }

  // 3) TEXTO: fade-in (sin mover carta)
  async function fadeInText() {
    if (!letterEl || !mount) return;
    // Asegura carta visible y sin transform
    letterEl.style.opacity = "1";
    letterEl.style.transform = "none";
    // Contenido con opacidad+blur, sin traslación
    mount.style.opacity = "0";
    mount.style.filter = "blur(6px)";
    await animate(
      mount,
      { opacity: [0, 1], filter: ["blur(6px)", "blur(0px)"] },
      { duration: 0.45, easing: "ease-out" }
    ).finished;
  }

  async function onOpen() {
    if (opening) return;
    opening = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);

      if (reduceMotion) {
        seal && (seal.style.opacity = "0");
        flap && (flap.style.transform = "rotateX(-178deg)");
        letterEl && (letterEl.style.opacity = "1");
        mount && (mount.style.opacity = "1");
        return;
      }

      await fadeSealFirst();                   // 1) sello
      await openFlapSlowWithBounceAndClicks(); // 2) flap (más lento)
      await fadeInText();                      // 3) texto (fade-in)

    } catch (err) {
      console.warn("No se pudo cargar el invitado:", err);
      if (letterEl) {
        letterEl.style.opacity = "1";
        mount && (mount.style.opacity = "1");
        letterEl.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`;
      }
      flap && (flap.style.transform = "rotateX(-178deg)");
      seal && (seal.style.opacity = "0");
    }
  }

  function onReset() {
    opening = false;
    flap && (flap.style.transform = "rotateX(0deg)");
    if (seal) { seal.style.opacity = ""; seal.style.transform = ""; }
    if (letterEl) { letterEl.style.opacity = "0"; letterEl.style.transform = "none"; }
    if (mount) { mount.style.opacity = "0"; mount.style.filter = ""; }
  }

  scene.addEventListener("click", onOpen);
  scene.setAttribute("tabindex", "0");
  scene.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }});
  resetBtn.addEventListener("click", onReset);
})();
