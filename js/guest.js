// guest.js: carga el invitado desde data/guests.json según el parámetro ?g=slug
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
      displayName: g.displayName || "Invitado/a",
      when: g.when || "",
      venueName: g.venueName || "",
      venueCity: g.venueCity || "",
      venueMap: g.venueMap || "#",
      plus: Number.isFinite(g.plus) ? g.plus : 0,
      message: g.message || ""
    };
  }

  async function loadAndNormalize() {
    const slug = getSlug();
    const data = await fetchGuests();            // { guests: [...] }
    const found = Array.isArray(data.guests)
      ? data.guests.find(x => (x.slug || "").toLowerCase() === slug.toLowerCase())
      : null;
    return normalize(found);
  }

  window.Guest = { loadAndNormalize };
})();
