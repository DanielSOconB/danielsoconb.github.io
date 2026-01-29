// Vídeo full-screen FIJO → fade-out → aparece la web (bloques)
// Autoscroll al Bloque 2 (letterMount). Sin parallax ni tarjetas internas.
(() => {
  const body      = document.body;
  const stage     = document.querySelector(".envelope-stage");
  const video     = document.getElementById("envelopeVideo");
  const whitefade = document.querySelector(".whitefade");
  const playBtn   = document.getElementById("videoPlayBtn");
  const skipBtn   = document.getElementById("skipVideoBtn");
  const site      = document.getElementById("site");

  const blockGuest = document.getElementById("blockGuest");
  const mapEmbed   = document.getElementById("mapEmbed");
  const infoList   = document.getElementById("infoList");
  const rsvpBtn    = document.getElementById("rsvpBtn");

  // Countdown refs
  const cdDays    = document.getElementById("cdDays");
  const cdHours   = document.getElementById("cdHours");
  const cdMinutes = document.getElementById("cdMinutes");
  const cdSeconds = document.getElementById("cdSeconds");
  const cdNote    = document.getElementById("cdNote");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = false;

  // TRUE: tras el vídeo, el bloque del invitado queda "arriba"
  const SCROLL_TO_GUEST = true;

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  /* ===== Carga de invitado y pintado de bloques dependientes ===== */
  async function loadGuestAndRender() {
    try {
      const g = await window.Guest.loadAndNormalize();

      // Bloque 4: mapa embebido (embed preferente)
      if (mapEmbed) {
        if (g.venueMapEmbed) {
          mapEmbed.src = g.venueMapEmbed;
        } else if (g.venueMap) {
          mapEmbed.src = g.venueMap;
        }
      }

      // Bloque 5: info práctica
      if (infoList) {
        infoList.innerHTML = "";
        if (g.dressCode) {
          const li = document.createElement("li");
          li.textContent = `Dress code: ${g.dressCode}.`;
          infoList.appendChild(li);
        }
        const liPlus = document.createElement("li");
        liPlus.textContent = g.plus > 0
          ? `Puedes venir con ${g.plus} acompañante(s).`
          : `Sin acompañante.`;
        infoList.appendChild(liPlus);

        if (Array.isArray(g.notes) && g.notes.length) {
          g.notes.forEach(n => {
            const li = document.createElement("li");
            li.textContent = n;
            infoList.appendChild(li);
          });
        }
      }

      // Bloque 6: RSVP
      if (rsvpBtn && g.rsvpUrl) rsvpBtn.href = g.rsvpUrl;

      // Bloque 3: countdown
      initCountdown(g.eventDateISO, g.when);

    } catch {
      initCountdown(null, null);
    }
  }

  /* ===== Countdown ===== */
  function initCountdown(eventISO, whenText) {
    let target = null;
    if (eventISO) {
      const t = Date.parse(eventISO);
      if (!Number.isNaN(t)) target = t;
    }

    function render(diffMs) {
      if (diffMs <= 0) {
        cdDays && (cdDays.textContent = "0");
        cdHours && (cdHours.textContent = "0");
        cdMinutes && (cdMinutes.textContent = "0");
        cdSeconds && (cdSeconds.textContent = "0");
        cdNote  && (cdNote.textContent  = "¡Hoy es el gran día!");
        return;
      }
      const sec = Math.floor(diffMs / 1000);
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;

      if (cdDays)    cdDays.textContent    = String(d);
      if (cdHours)   cdHours.textContent   = h.toString().padStart(2,"0");
      if (cdMinutes) cdMinutes.textContent = m.toString().padStart(2,"0");
      if (cdSeconds) cdSeconds.textContent = s.toString().padStart(2,"0");
      if (cdNote && whenText) cdNote.textContent = whenText;
    }

    if (!target) {
      cdNote && (cdNote.textContent = whenText || "");
      return;
    }

    render(target - Date.now());
    setInterval(() => { render(target - Date.now()); }, 1000);
  }

  /* ===== Mostrar sitio ===== */
  function showSiteBase() {
    stage?.classList.add("is-done");         // oculta el vídeo fijo
    site?.classList.add("site--visible");
    site?.setAttribute("aria-hidden", "false");
    body.classList.remove("no-scroll");
    startReveals();
  }

  function showSiteInstant() {
    showSiteBase();
    if (SCROLL_TO_GUEST && blockGuest) {
      setTimeout(() => { blockGuest.scrollIntoView({ behavior: "auto", block: "start" }); }, 30);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  async function fadeToSite() {
    if (whitefade) whitefade.style.opacity = "1";
    await wait(220);
    showSiteBase();
    if (whitefade) whitefade.style.opacity = "0";

    if (SCROLL_TO_GUEST && blockGuest) {
      setTimeout(() => { blockGuest.scrollIntoView({ behavior: "auto", block: "start" }); }, 30);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  /* ===== Vídeo ===== */
  async function startVideo() {
    if (started) return;
    started = true;

    await loadGuestAndRender();

    if (reduceMotion) { showSiteInstant(); return; }

    body.classList.add("no-scroll");
    try {
      if (video) {
        video.currentTime = 0;
        await video.play();
      }
    } catch {
      if (playBtn) playBtn.style.display = "inline-flex";
    }
  }

  function handleEnded() { fadeToSite(); }
  function skipVideo()   { try { video?.pause(); } catch {} showSiteInstant(); }

  stage?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.id === "skipVideoBtn") return;
    startVideo();
  });
  playBtn?.addEventListener("click", startVideo);
  skipBtn?.addEventListener("click", skipVideo);
  video?.addEventListener("ended", handleEnded);
  stage?.setAttribute("tabindex", "0");
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startVideo(); }
  });

  /* ===== Reveal on scroll ===== */
  function startReveals() {
    const items = document.querySelectorAll(".reveal-up");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });

    items.forEach(el => io.observe(el));

    requestAnimationFrame(() => {
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < vh * 0.95 && r.bottom > 0) {
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    });
  }
})();
