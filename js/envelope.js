// js/envelope.js (ESM): sello → flap (ágil al final) → texto (fade-in aún más pronto)
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

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Reproduce <audio id="..."> si existe (clickStart / clickEnd)
  function play(id, vol = 1) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const a = new Audio(el.currentSrc || el.src);
      a.volume = Math.max(0, Math.min(1, vol));
      a.play().catch(() => {});
    } catch {}
  }

  // Rellena la carta con los datos del invitado
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

  // 1) Sello primero (desvanece)
  async function fadeSealFirst() {
    if (!seal) return;
    await animate(seal, { opacity: [1, 0], scale: [1, 0.92] }, { duration: 0.45, easing: "ease-out" }).finished;
  }

  // 2) Flap: apertura + asentado (clic final adelantado) + micro-rebote
  async function openFlapTighterAndSyncText(startTextFade) {
    play("clickStart", 0.55); // despegue

    // Apertura principal (estable)
    await animate(
      flap,
      { rotateX: -181.5 },
      { duration: 0.92, easing: spring({ stiffness: 110, damping: 24 }), transformOrigin: "50% 0%" }
    ).finished;

    // Asentado más corto
    const settleDuration = 0.18; // 180 ms
    const settle = animate(
      flap,
      { rotateX: -178 },
      { duration: settleDuration, easing: spring({ stiffness: 160, damping: 26 }) }
    ).finished;

    // Clic final ADELANTADO (al 75% del asentado)
    const clickTiming = wait(settleDuration * 1000 * 0.75).then(() => play("clickEnd", 1.0));

    // Fade-in del texto 10 ms tras el clic (muy pegado) y solapado con el micro-rebote
    const textTiming = (async () => {
      await wait(settleDuration * 1000 * 0.75 + 10);
      await startTextFade(); // por defecto 220 ms en fadeInText()
    })();

    // Espera a terminar el asentado
    await settle;

    // Micro-rebote breve
    const rebound = animate(
      flap,
      { rotateX: [-178, -176.6, -178] },
      { duration: 0.10, easing: "ease-out" }
    ).finished;

    await Promise.all([rebound, clickTiming, textTiming]);
  }

  // 3) Texto: fade-in rápido (sin mover la carta)
  async function fadeInText(ms = 220) {
    if (!letterEl || !mount) return;
    letterEl.style.opacity = "1";
    letterEl.style.transform = "none";
    mount.style.opacity = "0";
    mount.style.filter = "blur(6px)";
    await animate(
      mount,
      { opacity: [0, 1], filter: ["blur(6px)", "blur(0px)"] },
      { duration: ms / 1000, easing: "ease-out" }
    ).finished;
  }

  // Secuencia principal
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

      await fadeSealFirst();                                   // 1) sello
      await openFlapTighterAndSyncText(() => fadeInText(220)); // 2) flap + texto casi inmediato al clic final

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
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  });
  resetBtn.addEventListener("click", onReset);
})();
