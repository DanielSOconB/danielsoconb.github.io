// js/envelope.js (ESM)
import { animate, spring } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene     = document.getElementById("scene");
  const resetBtn  = document.getElementById("resetBtn");
  const mount     = document.getElementById("letterMount");
  const letterEl  = mount?.parentElement; // <section class="letter letter--fill">
  const flap      = document.querySelector(".envelope__flap"); // <- flap real
  const envelope  = document.querySelector(".envelope");
  const seal      = document.querySelector(".seal");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opening = false;

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

  async function openFlapSpring() {
    // Hinge con overshoot suave: -182º → -178º
    await animate(
      flap,
      { rotateX: -182 },
      { duration: 0.65, easing: spring({ stiffness: 140, damping: 16 }), transformOrigin: "50% 0%" }
    ).finished;

    await animate(
      flap,
      { rotateX: -178 },
      { duration: 0.30, easing: spring({ stiffness: 180, damping: 22 }) }
    ).finished;
  }

  async function onOpen() {
    if (opening) return;
    opening = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
      if (letterEl) letterEl.style.opacity = "1";

      if (reduceMotion) {
        if (flap) flap.style.transform = "rotateX(-178deg)";
        if (seal) seal.style.opacity = "0";
        if (letterEl) {
          letterEl.style.transform = "translateY(-6%) scale(1)";
          letterEl.style.opacity = "1";
        }
        return;
      }

      // 1) Abre SOLO el flap (con spring en dos etapas)
      await openFlapSpring();

      // 2) Sello fuera
      animate(seal, { opacity: [1, 0], scale: [1, 0.92] }, { duration: 0.45, easing: "ease-out" });

      // 3) Carta sube con spring
      await animate(
        letterEl,
        { transform: ["translateY(18%) scale(0.96)", "translateY(-6%) scale(1)"], opacity: [0, 1] },
        { duration: 0.9, easing: spring({ stiffness: 120, damping: 20 }) }
      ).finished;

    } catch (err) {
      console.warn("No se pudo cargar el invitado:", err);
      if (letterEl) {
        letterEl.style.opacity = "1";
        letterEl.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`;
        letterEl.style.transform = "translateY(-6%) scale(1)";
      }
      if (flap) flap.style.transform = "rotateX(-178deg)";
      if (seal) seal.style.opacity = "0";
    }
  }

  function onReset() {
    opening = false;
    if (flap) flap.style.transform = "rotateX(0deg)";
    if (seal) { seal.style.opacity = ""; seal.style.transform = ""; }
    if (letterEl) {
      letterEl.style.opacity = "0";
      letterEl.style.transform = "translateY(18%) scale(0.96)";
      letterEl.style.width = ""; letterEl.style.height = ""; letterEl.style.borderRadius = "";
    }
  }

  // (Opcional) parallax muy sutil para el SOBRE — puedes borrar si no lo quieres
  if (!reduceMotion && envelope && window.matchMedia("(pointer:fine)").matches) {
    let raf = 0, targetX = 0, targetY = 0;
    const maxTilt = 6;
    function tick() { raf = 0; envelope.style.transform = `rotateX(${targetY}deg) rotateY(${targetX}deg)`; }
    scene.addEventListener("pointermove", (e) => {
      const r = scene.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targetX = nx * maxTilt; targetY = -ny * maxTilt;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    scene.addEventListener("pointerleave", () => {
      animate(envelope, { rotateX: 0, rotateY: 0 }, { duration: 0.3, easing: "ease-out" });
    });
  }

  // Eventos
  scene.addEventListener("click", onOpen);
  scene.setAttribute("tabindex", "0");
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  });
  resetBtn.addEventListener("click", onReset);
})();
