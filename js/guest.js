// Slug y carga de invitado desde /data/guests.json
window.Guest = {
  inferSlug() {
    let path = window.location.pathname;
    const hash = window.location.hash || '';
    if (hash.startsWith('#!')) {
      try { path = decodeURIComponent(hash.slice(2)); } catch (_) {}
    }
    const qs = new URLSearchParams(window.location.search);
    if (!/\/invitado\//.test(path) && qs.get('code')) return qs.get('code');

    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (!last) return '';
    return last.includes('--') ? last.split('--').pop() : last;
  },

  async load(slug) {
    // Carga siempre desde la raíz del servidor (local y GitHub Pages)
    const url = `${window.location.origin}/data/guests.json?v=${Date.now()}`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
    const data = await res.json();
    return data.find(g => g.slug === slug);
  }
};
