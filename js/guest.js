// Utilidades para leer el slug y cargar el invitado desde /data/guests.json
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
    const res = await fetch('./data/guests.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar guests.json');
    const guests = await res.json();
    return guests.find(g => g.slug === slug);
  }
};
