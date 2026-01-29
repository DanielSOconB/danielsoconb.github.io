// guest.js: carga el invitado desde data/guests.json (?g=slug) y pinta el Bloque 2 (letterMount)
(function () {
  async function fetchGuests() {
    const res = await fetch("./data/guests.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar guests.json");
    return res.json();
  }

  function getSlug() {
    const p = new URLSearchParams(location.search);
    return p.get("g") || p.get("guest") || "default";
  }

  function normalize(guest) {
    const g = guest || {};
    return {
      slug: g.slug || "default",
      displayName: g.displayName || "Invitado/a",
      message: g.message || "¡Nos encantaría que nos acompañaras!",
      when: g.when || "",
      eventDateISO: g.eventDateISO || null,
      venueName: g.venueName || "",
      venueCity: g.venueCity || "",
      venueMap: g.venueMap || "#",
      venueMapEmbed: g.venueMapEmbed || "",
      plus: Number.isFinite(g.plus) ? g.plus : 0,
      dressCode: g.dressCode || "",
      notes: Array.isArray(g.notes) ? g.notes : [],
      rsvpUrl: g.rsvpUrl || "https://forms.gle/XXXXXXXXXXXXXXX"
    };
  }

  function renderLetter(g) {
    const mount = document.getElementById("letterMount");
    if (!mount) return;
    const venueFull = g.venueCity ? `${g.venueName}, ${g.venueCity}` : g.venueName;

    mount.innerHTML = `
      <h2 class="title">Hola, <strong>${g.displayName}</strong></h2>
      <p class="who">${g.message}</p>
      <p class="meta"><strong>Cuándo:</strong> <span>${g.when}</span></p>
      <p class="meta"><strong>Dónde:</strong> <a href="${g.venueMap}" target="_blank" rel="noopener">${venueFull}</a></p>
      <p class="meta"><strong>Acompañantes:</strong> <span>${g.plus}</span></p>
    `;
  }

  async function loadAndNormalize() {
    const slug = getSlug();
    const data = await fetchGuests(); // { guests: [...] }
    const found = Array.isArray(data.guests)
      ? data.guests.find(x => (x.slug || "").toLowerCase() === slug.toLowerCase())
      : null;
    const g = normalize(found);
    renderLetter(g);
    return g;
  }

  window.Guest = { loadAndNormalize };
})();
