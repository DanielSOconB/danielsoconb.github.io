// js/envelope.js (ESM)
import { animate, spring } from "https://cdn.jsdelivr.net/npm/motion@10.16.4/+esm";

(() => {
  const scene     = document.getElementById("scene");
  const resetBtn  = document.getElementById("resetBtn");
  const mount     = document.getElementById("letterMount");
  const letterEl  = mount?.parentElement; // <section class="letter letter--fill">
  const flapOuter = document.querySelector(".envelope__flap--outer");

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

  async function onOpen() {
    if (opening) return;
    opening = true;

    try {
      const guest = await window.Guest.loadAndNormalize();
      renderLetter(guest);

      // Aseguramos visibilidad del texto
      if (letterEl) letterEl.style.opacity = "1";

      // 🎬 Animación del flap con “spring”
      await animate(
        flapOuter,
        { rotateX: -178 },
        {
          duration: 0.8,
          easing: spring({ stiffness: 120, damping: 18 }),
          // redundante, pero asegura el pivote por si el CSS cambia:
          transformOrigin: "50% 0%"
        }
      ).finished;

      // Ahora disparamos las animaciones CSS (seal fade + letterFill/letterRise)
      scene.classList.add("open");
    } catch (err) {
      // En caso de error seguimos mostrando la carta para no bloquear UX
      console.warn("No se pudo cargar el invitado:", err);
      if (letterEl) letterEl.style.opacity = "1";
      mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`;
      scene.classList.add("open");
    }
  }

  function onReset() {
    opening = false;
    scene.classList.remove("open");
    // Reiniciar estado del flap
    if (flapOuter) flapOuter.style.transform = "rotateX(0deg)";
  }

  // Eventos: clic/teclado abren; reset para pruebas
  scene.addEventListener("click", onOpen);
  scene.setAttribute("tabindex", "0");
  scene.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  });
  resetBtn.addEventListener("click", onReset);
})();
