// js/envelope.js (ESM): flap con click de inicio + spring + rebote + click final
import { animate, spring } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene     = document.getElementById("scene");
  const resetBtn  = document.getElementById("resetBtn");
  const mount     = document.getElementById("letterMount");
  const letterEl  = mount?.parentElement; // <section class="letter letter--fill">
  const flap      = document.querySelector(".envelope__flap");
  const seal      = document.querySelector(".seal");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opening = false;
  let audioCtx = null;

  // --------- Audio helpers ---------
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  // Fallback sintético (ruido bandpass + tick triangular)
  function playSyntheticClick(volume = 1.0) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      // Ruido corto (~70ms)
      const len = 0.07;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 6;

      const g = ctx.createGain();
      const target = Math.max(0.0001, 0.5 * volume);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(target, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + len);

      noise.connect(bp).connect(g).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + len);

      // “Tick” breve (~90ms)
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, now);
      const og = ctx.createGain();
      const tTarget = Math.max(0.0001, 0.12 * volume);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.linearRampToValueAtTime(tTarget, now + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(og).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (_) { /* ignore */ }
  }

  // Reproduce <audio id="..."> con volumen; si no está listo, usa fallback sintético
  function playSound(id, volume = 1.0) {
    if (reduceMotion) return; // opcional: silencio si usuario pide menos estímulos
    const el = document.getElementById(id);
    if (!el) return playSyntheticClick(volume);
    try {
      // Clon ligero para evitar solapar el elemento original
      const src = el.currentSrc || el.src;
      if (!src) return playSyntheticClick(volume);
      const a = new Audio(src);
      a.volume = Math.max(0, Math.min(1, volume));
      a.play().catch(() => playSyntheticClick(volume));
    } catch {
      playSyntheticClick(volume);
    }
  }

  // --------- Carta / contenido ---------
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

  // --------- Animación del FLAP con rebote y clics ---------
  async function openFlapWithBounceAndClicks() {
    // Clic de “despegue” (suave) justo antes de arrancar
    playSound("clickStart", 0.55);

    // Apertura principal con spring y ligera sobre-extensión
    await animate(
      flap,
      { rotateX: -182 },
      { duration: 0.65, easing: spring({ stiffness: 140, damping: 16 }), transformOrigin: "50% 0%" }
    ).finished;

    // Corrección al ángulo de reposo
    await animate(
      flap,
      { rotateX: -178 },
      { duration: 0.30, easing: spring({ stiffness: 180, damping: 22 }) }
    ).finished;

    // Clic de “asentado” y micro-rebote final (−178 → −176 → −178)
    playSound("clickEnd", 1.0);
    await animate(
      flap,
      { rotateX: [-178, -176, -178] },
      { duration: 0.12, easing: "ease-out" }
    ).finished;
  }

  // --------- Secuencia de apertura ---------
  async function onOpen() {
    if (opening) return;
    opening = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);
      if (letterEl) letterEl.style.opacity = "1";

      if (reduceMotion) {
        flap && (flap.style.transform = "rotateX(-178deg)");
        seal && (seal.style.opacity = "0");
        if (letterEl) {
          letterEl.style.transform = "translateY(-6%) scale(1)";
          letterEl.style.opacity = "1";
        }
        return;
      }

      // 1) Flap: spring + rebote + clics
      await openFlapWithBounceAndClicks();

      // 2) Sello fuera
      animate(seal, { opacity: [1, 0], scale: [1, 0.92] }, { duration: 0.45, easing: "ease-out" });

      // 3) Carta: subir + aparecer (spring)
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
      flap && (flap.style.transform = "rotateX(-178deg)");
      seal && (seal.style.opacity = "0");
    }
  }

  function onReset() {
    opening = false;
    flap && (flap.style.transform = "rotateX(0deg)");
    if (seal) { seal.style.opacity = ""; seal.style.transform = ""; }
    if (letterEl) {
      letterEl.style.opacity = "0";
      letterEl.style.transform = "translateY(18%) scale(0.96)";
      letterEl.style.width = ""; letterEl.style.height = ""; letterEl.style.borderRadius = "";
    }
  }

  // Eventos
  scene.addEventListener("click", onOpen);
  scene.setAttribute("tabindex", "0");
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  });
  resetBtn.addEventListener("click", onReset);
})();
