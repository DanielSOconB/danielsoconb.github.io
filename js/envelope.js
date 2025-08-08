(function(){
  const scene      = document.getElementById('scene');
  const resetBtn   = document.getElementById('resetBtn');
  const $guestName = document.getElementById('guestName');
  const $guestCode = document.getElementById('guestCode');
  const $dateText  = document.getElementById('dateText');
  const $venueLink = document.getElementById('venueLink');
  const $plus      = document.getElementById('plus');

  let opened = false;
  function openEnvelope(){ if (opened) return; opened = true; scene.classList.add('open'); }
  function resetEnvelope(){ opened = false; scene.classList.remove('open'); }

  // Click / teclado en toda la escena
  scene.addEventListener('click', openEnvelope);
  scene.setAttribute('tabindex','0');
  scene.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });
  resetBtn.addEventListener('click', resetEnvelope);

  // Rellena desde slug + guests.json
  (async function bootstrap(){
    try {
      const slug = window.Guest.inferSlug();
      if (!slug) return;
      $guestCode.textContent = slug;

      const g = await window.Guest.load(slug);
      if (!g) return;

      if (g.displayName) $guestName.textContent = g.displayName;
      if (typeof g.maxPlusOnes === 'number') $plus.textContent = g.maxPlusOnes;

      if (g.date || g.time) {
        const dateStr = [g.date, g.time].filter(Boolean).join(' – ');
        if ($dateText) $dateText.textContent = dateStr;
      }
      if (g.venueName) {
        if ($venueLink) {
          $venueLink.textContent = g.venueName + (g.venueCity ? ', ' + g.venueCity : '');
          $venueLink.href = g.venueMap || '#';
        }
      }
    } catch (err) {
      console.warn('Error rellenando invitación:', err);
    }
  })();
})();
