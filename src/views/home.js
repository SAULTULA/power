import config from '../config.js';
import { escapeHtml } from '../utils.js';
import { buildHash } from '../router.js';

export function renderHome() {
  return `
    <!-- HERO -->
    <section class="hero">
      <div class="hero__bg" aria-hidden="true"></div>

      <div class="hero__grid container anim-up">
        <div>
          <span class="hero__badge">
            <span class="hero__badge-dot" aria-hidden="true"></span>
            // transmitiendo en vivo
          </span>

          <h1 class="hero__title">
            <span class="hero__title-em">104.1 FM</span>
            <span class="hero__title-neon">POWER</span>
            <span class="hero__title-solid">Radio.</span>
          </h1>

          <p class="hero__sub">
            ${escapeHtml(config.eslogan)} — la frecuencia que domina la noche y el día.
          </p>

          <div class="hero__actions">
            <button class="btn btn--primary" id="hero-play-btn" aria-label="Escuchar POWER 104.1 FM en vivo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Escuchar ahora
            </button>
            <a href="${buildHash('videos')}" class="btn btn--ghost">
              Videos →
            </a>
          </div>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <div class="hero__frame">
            <div class="hero__corner-tl"></div>
            <div class="hero__corner-br"></div>
            <div class="hero__frame-inner">
              <img
                class="hero__logo-img"
                src="assets/img/logo.png"
                alt=""
                width="380"
                height="380"
                loading="eager"
                decoding="async"
              />
              <div class="hero__scanline"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PROGRAMACIÓN -->
    <section class="section programs" id="programas" aria-labelledby="programs-title">
      <div class="container">
        <header class="section__header">
          <div class="section__header-inner">
            <p class="section__label">// on_air</p>
            <h2 class="section__title" id="programs-title">Programación</h2>
            <p class="section__sub">Acompañando tu día con la mejor energía.</p>
          </div>
        </header>

        <ul class="programs__list" role="list">
          ${[
            { time: '06:00–09:00', name: 'Mañana Power',     host: 'Juan Pérez',    active: false },
            { time: '09:00–13:00', name: 'Power Mix',         host: 'Ana Gómez',     active: false },
            { time: '13:00–17:00', name: 'Tarde Activa',      host: 'Carlos Ruiz',   active: true  },
            { time: '17:00–21:00', name: 'El Regreso',        host: 'Laura Torres',  active: false },
            { time: '21:00–06:00', name: 'Noche Sin Límites', host: 'DJ Sombra',     active: false },
          ].map(p => `
            <li class="program${p.active ? ' program--active' : ''}">
              <time class="program__time">${escapeHtml(p.time)}</time>
              <div>
                <p class="program__name">${escapeHtml(p.name)}</p>
                <p class="program__host">${escapeHtml(p.host)}</p>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    </section>
  `;
}
