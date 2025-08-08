(function () {
  const scene = document.getElementById("scene");
  const resetBtn = document.getElementById("resetBtn");
  const mount = document.getElementById("letterMount");

  let opening = false;

  function renderLetter(g) {
    // Construye el contenido dinámicamente tras el primer clic
    const venueFull = g.venueCity
      ? `${g.venueName}, ${g.venueCity}`
      : g.venueName;
    const code = g.slug || "";
    const extra = g.message ? `<p class="meta">${g.message}</p>` : "";
    mount.innerHTML = `
      <h2 class="title">¡Nos casamos!</h2>
      <p class="who">Hola <strong>${
        g.displayName
      }</strong>, nos encantaría que nos acompañaras.</p>
      <p class="meta"><strong>Cuándo:</strong> <span>${g.when || ""}</span></p>
      <p class="meta"><strong>Dónde:</strong> <a href="${
        g.venueMap
      }" target="_blank" rel="noopener">${venueFull}</a></p>
      <p class="meta"><strong>Acompañantes permitidos:</strong> <span>${
        g.plus
      }</span></p>
      <p class="meta">Código: <code>${code}</code></p>
      ${extra}
    `;
  }

async function onOpen() {
  if (opening) return;
  opening = true;
  try {
    const guest = await window.Guest.loadAndNormalize();
    renderLetter(guest);
    scene.classList.add("open");
    mount.parentElement.style.opacity = "1";
    // Espera a que termine la animación de la carta antes de mostrar el texto
    setTimeout(() => {
      mount.classList.add("show-text");
    }, 900); // Ajusta el tiempo según la duración de la animación
  } catch (err) {
    console.warn("No se pudo cargar el invitado:", err);
    mount.innerHTML = `<h2 class="title">Invitación</h2><p class="meta">No se pudo cargar tu enlace. Prueba de nuevo más tarde.</p>`;
    scene.classList.add("open");
    mount.parentElement.style.opacity = "1";
    setTimeout(() => {
      mount.classList.add("show-text");
    }, 900);
  }
}

  function onReset() {
    opening = false;
    scene.classList.remove("open");
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
