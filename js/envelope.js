(function(){
  const scene = document.getElementById('scene');
  const resetBtn = document.getElementById('resetBtn');
  const $guestName = document.getElementById('guestName');
  const $guestCode = document.getElementById('guestCode');

  let opened = false;

  function openEnvelope(){ if (opened) return; opened = true; scene.classList.add('open'); }
  function resetEnvelope(){ opened = false; scene.classList.remove('open'); }

  // Captura click/teclado en toda la escena
  scene.addEventListener('click', openEnvelope);
  scene.setAttribute('tabindex','0');
  scene.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });
  resetBtn.addEventListener('click', resetEnvelope);

  // Rellena nombre y código desde la URL y guests.json
  (async function bootstrapGuest(){
    try {
      const slug = window.Guest.inferSlug();
      if (!slug) return;

      $guestCode.textContent = slug;
      const g = await window.Guest.load(slug);
      if (g && g.displayName) $guestName.textContent = g.displayName;
    } catch (err) {
      console.warn('Guest bootstrap error', err);
    }
  })();
})();
