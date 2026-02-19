// guest.js: carga el invitado desde data/guests.json (?g=slug) y pinta el Bloque 2 (letterMount)
(function () {
  const DEFAULT_RSVP = "https://forms.gle/Ji6xnzei4y6FcLvM6";

  async function fetchGuests() {
    const res = await fetch("./data/guests.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar guests.json");
    return res.json();
  }

  function getSlug() {
    const p = new URLSearchParams(location.search);
    return p.get("g") || p.get("guest") || "default";
  }

  function asString(value, fallback) {
    if (typeof value !== "string") return fallback;
    const text = value.trim();
    return text || fallback;
  }

  function normalizeUrl(value, fallback) {
    const raw = asString(value, "");
    if (!raw) return fallback;
    try {
      const parsed = new URL(raw, location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch {}
    return fallback;
  }

  function normalizeISODate(value) {
    const raw = asString(value, "");
    if (!raw) return null;
    return Number.isNaN(Date.parse(raw)) ? null : raw;
  }

  function normalize(guest) {
    const g = guest || {};
    const plus = Number(g.plus);
    return {
      slug: asString(g.slug, "default"),
      displayName: asString(g.displayName, "Invitado/a"),
      message: asString(g.message, "¡Nos encantaría que nos acompañaras!"),
      when: asString(g.when, ""),
      eventDateISO: normalizeISODate(g.eventDateISO),
      venueName: asString(g.venueName, "Lugar por confirmar"),
      venueCity: asString(g.venueCity, ""),
      venueMap: normalizeUrl(g.venueMap, "#"),
      venueMapEmbed: normalizeUrl(g.venueMapEmbed, ""),
      plus: Number.isFinite(plus) && plus > 0 ? Math.floor(plus) : 0,
      dressCode: asString(g.dressCode, ""),
      notes: Array.isArray(g.notes)
        ? g.notes.map((n) => asString(n, "")).filter(Boolean)
        : [],
      rsvpUrl: normalizeUrl(g.rsvpUrl, DEFAULT_RSVP)
    };
  }

  function createMetaLine(label, contentNode) {
    const p = document.createElement("p");
    p.className = "meta";
    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;
    p.appendChild(strong);
    p.append(" ");
    p.appendChild(contentNode);
    return p;
  }

  function renderLetter(g) {
    const mount = document.getElementById("letterMount");
    if (!mount) return;

    const venueFull = g.venueCity ? `${g.venueName}, ${g.venueCity}` : g.venueName;
    const title = document.createElement("h2");
    title.className = "title";
    title.append("Hola, ");
    const strongName = document.createElement("strong");
    strongName.textContent = g.displayName;
    title.appendChild(strongName);

    const message = document.createElement("p");
    message.className = "who";
    message.textContent = g.message;

    const whenValue = document.createElement("span");
    whenValue.textContent = g.when || "Fecha por confirmar";

    const whereValue = g.venueMap !== "#"
      ? document.createElement("a")
      : document.createElement("span");
    whereValue.textContent = venueFull;
    if (whereValue.tagName === "A") {
      whereValue.href = g.venueMap;
      whereValue.target = "_blank";
      whereValue.rel = "noopener";
    }

    const plusValue = document.createElement("span");
    plusValue.textContent = String(g.plus);
    const companionsLine = g.plus > 0
      ? createMetaLine("Acompañantes", plusValue)
      : (() => {
          const p = document.createElement("p");
          p.className = "meta";
          p.textContent = "Sin acompañantes";
          return p;
        })();

    mount.replaceChildren(
      title,
      message,
      createMetaLine("Cuándo", whenValue),
      createMetaLine("Dónde", whereValue),
      companionsLine
    );
  }

  async function loadAndNormalize() {
    const slug = getSlug();
    const data = await fetchGuests(); // { guests: [...] }
    const found = Array.isArray(data.guests)
      ? data.guests.find((x) => asString(x && x.slug, "").toLowerCase() === slug.toLowerCase())
      : null;
    const g = normalize(found);
    renderLetter(g);
    return g;
  }

  window.Guest = { loadAndNormalize };
})();
