window.Guest = {
  inferSlug() {
    let slug = window.location.pathname.replace(/^\//, '').trim();
    const hash = window.location.hash || '';
    if (hash.startsWith('#!')) {
      try { slug = decodeURIComponent(hash.slice(2)).replace(/^\//, ''); } catch (_) {}
    }
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('code')) return qs.get('code');
    return slug || '';
  },

  async load(slug) {
    const url = `${window.location.origin}/data/guests.json?v=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
    const data = await res.json();
    return data.find(g => g.slug === slug);
  }
};
