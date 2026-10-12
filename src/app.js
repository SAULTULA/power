import config from './config.js';
import { escapeHtml } from './utils.js';
import { onRouteChange, buildHash } from './router.js';
import { initPlayer } from './player.js';

import { renderHome }     from './views/home.js';
import { renderVideos }   from './views/videos.js';
import { renderContacto } from './views/contacto.js';

/* ── Nav ─────────────────────────────────────────────── */
function renderNav(activeRoute = 'home') {
  const links = [
    { href: buildHash('home'),    label: 'Inicio',       name: 'home' },
    { href: buildHash('videos'),  label: 'Videos',       name: 'videos' },
    { href: buildHash('contacto'),label: 'Contacto',     name: 'contacto' },
  ];

  return `
    <nav class="nav" aria-label="Navegación principal">
      <div class="nav__inner">
        <a href="${buildHash('home')}" class="nav__logo">
          <span class="nav__logo-power">POWER</span>
          <span class="nav__logo-freq">104.1 FM</span>
        </a>
        <ul class="nav__links" role="list">
          ${links.map(l => `
            <li>
              <a
                href="${l.href}"
                class="nav__link${activeRoute === l.name ? ' nav__link--active' : ''}"
                ${activeRoute === l.name ? 'aria-current="page"' : ''}
              >${escapeHtml(l.label)}</a>
            </li>
          `).join('')}
        </ul>
        <button
          class="nav__cta"
          id="nav-play-btn"
          aria-label="Reproducir señal en vivo"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z"/>
          </svg>
          En vivo
        </button>
      </div>
    </nav>`;
}

/* ── Footer ──────────────────────────────────────────── */
function renderFooter() {
  return `
    <footer class="footer" aria-label="Pie de página">
      <div class="footer__grid">
        <div>
          <h2 class="footer__logo">POWER <span>104.1 FM</span></h2>
          <p class="footer__desc">${escapeHtml(config.eslogan)} — la señal que te mueve las 24 horas del día.</p>
        </div>
        <div>
          <h3 class="footer__heading">Sitio</h3>
          <ul class="footer__links" role="list">
            <li><a href="${buildHash('home')}" class="footer__link">Inicio</a></li>
            <li><a href="${buildHash('videos')}" class="footer__link">Videos</a></li>
            <li><a href="${buildHash('contacto')}" class="footer__link">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer__heading">Contacto rápido</h3>
          <ul class="footer__links" role="list">
            <li>
              <a href="https://wa.me/${escapeHtml(config.contacto.whatsapp)}"
                 class="footer__link"
                 target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </li>
            <li>
              <a href="mailto:${escapeHtml(config.contacto.email)}"
                 class="footer__link">${escapeHtml(config.contacto.email)}</a>
            </li>
          </ul>
        </div>
      </div>
      <p class="footer__copy">&copy; ${new Date().getFullYear()} ${escapeHtml(config.nombre)}. Todos los derechos reservados.</p>
    </footer>`;
}

/* ── App bootstrap ───────────────────────────────────── */
const navRoot    = document.getElementById('nav-root');
const viewEl     = document.getElementById('view');
const playerRoot = document.getElementById('player-root');
const lbRoot     = document.getElementById('lightbox-root');

initPlayer(playerRoot);

onRouteChange(route => {
  // Update nav
  navRoot.innerHTML = renderNav(route.name);

  // Wire nav CTA to player
  document.getElementById('nav-play-btn')?.addEventListener('click', () => {
    document.querySelector('.player__boton')?.click();
  });

  // Render view
  let html = '';
  if (route.name === 'home')     html = renderHome();
  else if (route.name === 'videos')   html = renderVideos(lbRoot);
  else if (route.name === 'contacto') html = renderContacto();
  else html = renderHome();

  viewEl.innerHTML = html + renderFooter();

  // Wire hero play button
  document.getElementById('hero-play-btn')?.addEventListener('click', () => {
    document.querySelector('.player__boton')?.click();
  });

  // Wire video cards for lightbox
  document.querySelectorAll('[data-video-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.videoId;
      lbRoot.innerHTML = `
        <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Video">
          <div class="lightbox__inner">
            <button class="lightbox__close" aria-label="Cerrar video" id="lb-close">&times;</button>
            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(id)}?autoplay=1"
              allow="autoplay; fullscreen"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>`;
      document.getElementById('lb-close')?.addEventListener('click', () => {
        lbRoot.innerHTML = '';
      });
      document.getElementById('lightbox')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) lbRoot.innerHTML = '';
      });
    });
  });

  // Scroll to top on route change
  window.scrollTo({ top: 0, behavior: 'instant' });
});
