const GOOGLE_FORM_BASE = null;

const App = {
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
  async loadGuest(slug) {
    const res = await fetch('./data/guests.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar guests.json');
    const guests = await res.json();
    return guests.find(g => g.slug === slug);
  },
  buildInviteHtml(g) {
    const dateStr = 'Sábado, 25 de Octubre de 2025';
    const timeStr = '17:00';
    const venueName = 'Finca Los Olivos';
    const venueMap = 'https://maps.google.com/?q=Finca+Los+Olivos';
    const rsvpBtn = GOOGLE_FORM_BASE ? `<a class=\"btn\" target=\"_blank\" rel=\"noopener\" href=\"${GOOGLE_FORM_BASE}\">Confirmar asistencia</a>` : '';
    return `
      <p class=\"hello\">¡Hola, <strong>${g.displayName}</strong>!</p>
      <p>Nos hace mucha ilusión invitarte a nuestra boda.</p>
      <div class=\"info\">
        <p><strong>Cuándo:</strong> ${dateStr} · ${timeStr}</p>
        <p><strong>Dónde:</strong> <a href=\"${venueMap}\" target=\"_blank\" rel=\"noopener\">${venueName}</a></p>
        <p><strong>Acompañantes permitidos:</strong> ${g.maxPlusOnes ?? 0}</p>
      </div>
      ${rsvpBtn}
      <details class=\"mt\">
        <summary>Detalles</summary>
        <ul>
          <li>Dress code: elegante cómodo</li>
          <li>Aparcamiento en recinto</li>
          <li>Niños bienvenidos</li>
        </ul>
      </details>
    `;
  },
  showError(msg) {
    const $err = document.getElementById('error');
    const $inv = document.getElementById('invite');
    if ($inv) $inv.classList.add('hidden');
    if ($err) { $err.classList.remove('hidden'); $err.innerHTML = `<p class=\"error\">${msg}</p>`; }
    else alert(msg);
  },
  async init() {
    const slug = this.inferSlug();
    const $sub = document.querySelector('.subtitle');
    try {
      if (!slug) throw new Error('No se encontró el código de invitado en la URL.');
      const guest = await this.loadGuest(slug);
      if (!guest) throw new Error('Invitado no encontrado. Verifica tu enlace.');
      const $inv = document.getElementById('invite');
      if ($sub) $sub.remove();
      $inv.classList.remove('hidden');
      $inv.innerHTML = this.buildInviteHtml(guest);
    } catch (e) {
      console.error(e);
      if ($sub) $sub.remove();
      this.showError(e.message || 'Ha ocurrido un error.');
    }
  }
};
window.addEventListener('DOMContentLoaded', () => App.init());