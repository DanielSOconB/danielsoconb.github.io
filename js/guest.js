// Utilidades para extraer el slug y cargar/normalizar un invitado
window.Guest = (function(){
  function inferSlug(){
    // slug puro en path (Pages), hash (#!) o fallback ?code=
    let slug = window.location.pathname.replace(/^\//,'').trim();
    const hash = window.location.hash || '';
    if (hash.startsWith('#!')) {
      try { slug = decodeURIComponent(hash.slice(2)).replace(/^\//,''); } catch(_){}
    }
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('code')) return qs.get('code');
    return slug || '';
  }

  async function loadRaw(slug){
    const url = `${window.location.origin}/data/guests.json?v=${Date.now()}`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
    const list = await res.json();
    return Array.isArray(list) ? list.find(g => g.slug === slug) : null;
  }

  function normalize(raw){
    if (!raw) return null;
    const displayName = raw.displayName || raw.nombre || '';
    const dateText    = raw.date || raw.fecha || '';
    const time        = raw.time || raw.hora || '';
    const when        = [dateText, time].filter(Boolean).join(' – ');
    const venueName   = raw.venueName || raw.lugar || '';
    const venueCity   = raw.venueCity || raw.ciudad || '';
    const venueMap    = raw.venueMap || raw.mapa || '#';
    const plus        = typeof raw.maxPlusOnes === 'number' ? raw.maxPlusOnes : (typeof raw.acompanantes === 'number' ? raw.acompanantes : 0);
    const message     = raw.message || raw.mensaje || '';

    return { slug: raw.slug, displayName, when, venueName, venueCity, venueMap, plus, message };
  }

  async function loadAndNormalize(){
    const slug = inferSlug();
    if (!slug) throw new Error('No hay slug en la URL');
    const raw = await loadRaw(slug);
    if (!raw) throw new Error('Invitado no encontrado');
    return normalize(raw);
  }

  return { inferSlug, loadAndNormalize };
})();