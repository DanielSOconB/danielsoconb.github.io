// js/envelope.js (ESM): sello → flap (más lento) → texto (fade-in)
import { animate, spring } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene     = document.getElementById("scene");
  const resetBtn  = document.getElementById("resetBtn");
  const mount     = document.getElementById("letterMount");    // .letter__inner
  const letterEl  = mount?.parentElement;                       // <section class="letter">
  const flap      = document.querySelector(".envelope__flap");
  const seal      = document.querySelector(".seal");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opening = false;
  let audioCtx = null;

  // --------- Audio helpers (idénticos a los tuyos) ---------
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }
  function playSyntheticClick(volume = 1.0) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const len = 0.07;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 6;
      const g = ctx.createGain();
      const target = Math.max(0.0001, 0.5 * volume);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(target, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      noise.connect(bp).connect(g).connect(ctx.destination);
      noise.start(now); noise.stop(now + len);
      const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.setValueAtTime(450, now);
      const og = ctx.createGain();
      const tTarget = Math.max(0.0001, 0.12 * volume);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.linearRampToValueAtTime(tTarget, now + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(og).connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.09);
    } catch {}
  }
  function playSound(id, volume = 1.0) {
    if (reduceMotion) return;
    const el = document.getElementById(id);
    if (!el) return playSyntheticClick(volume);
    try {
      const src = el.currentSrc || el.src; if (!src) return playSyntheticClick(volume);
      const a = new Audio(src); a.volume = Math.max(0, Math.min(1, volume));
      a.play().catch(() => playSyntheticClick(volume));
    } catch { playSyntheticClick(volume); }
  }

  // --------- Render carta ---------
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

  // --------- Sello primero ---------
  async function fadeSealFirst() {
    if (!seal) return;
    await animate(seal, { opacity: [1, 0], scale: [1, 0.92] }, { duration: 0.45, easing: "ease-out" }).finished;
  }

  // --------- Flap más lento + micro-rebote + clics ---------
  async function openFlapSlowWithBounceAndClicks() {
    playSound("clickStart", 0.55);
    // Apertura lenta (más amortiguada)
    await animate(
      flap,
      { rotateX: -182 },
      { duration: 1.15, easing: spring({ stiffness: 110, damping: 22 }), transformOrigin: "50% 0%" }
    ).finished;
    // Asentado al ángulo final
    await animate(
      flap,
      { rotateX: -178 },
      { duration: 0.45, easing: spring({ stiffness: 160, damping: 26 }) }
    ).finished;
    // Micro-rebote + clic final
    playSound("clickEnd", 1.0);
    await animate(flap, { rotateX: [-178, -176.4, -178] }, { duration: 0.18, easing: "ease-out" }).finished;
  }

  // --------- Texto: F A D E  I N (sin desplazar la carta) ---------
  async function fadeInText() {
    if (!letterEl || !mount) return;
    // Asegura carta visible y sin transform
    letterEl.style.opacity = "1";
    letterEl.style.transform = "none";
    // El contenido aparece con fade + blur, sin mover nada
    mount.style.opacity = "0";
    mount.style.filter = "blur(6px)";
    await animate(mount, { opacity: [0, 1], filter: ["blur(6px)", "blur(0px)"] }, { duration: 0.45, easing: "ease-out" }).finished;
  }

  // --------- Secuencia ---------
  async function onOpen() {
    if (opening) return;
    opening = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);

      if (reduceMotion) {
        seal && (seal.style.opacity = "0");
        flap && (flap.style.transform = "rotateX(-178deg)");
        if (letterEl) letterEl.style.opacity = "1";
        if (mount)    mount.style.opacity = "1";
        return;
      }

      await fadeSealFirst();                   // 1) Sello
      await openFlapSlowWithBounceAndClicks(); // 2) Flap (más lento)
      await fadeInText();                      // 3) Texto (fade-in)

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
