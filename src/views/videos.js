import { escapeHtml } from '../utils.js';

/* Videos de muestra — en producción se reemplaza con data/videos.json */
const VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Entrevista Exclusiva: Los mejores momentos',
    thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    duration: '8:42',
  },
  {
    id: '3JZ_D3ELwOQ',
    title: 'Lo mejor del rock nacional 2024',
    thumb: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
    duration: '5:17',
  },
  {
    id: 'L_jWHffIx5E',
    title: 'Top 10 canciones de la semana',
    thumb: 'https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg',
    duration: '12:04',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Concierto en vivo: Night Stage',
    thumb: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: '45:30',
  },
  {
    id: 'iLBBRuVDOSI',
    title: 'Behind the Mic: el estudio de POWER',
    thumb: 'https://i.ytimg.com/vi/iLBBRuVDOSI/hqdefault.jpg',
    duration: '6:55',
  },
  {
    id: 'hT_nvWreIhg',
    title: 'Playlist de verano — no para nunca',
    thumb: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    duration: '1:02:11',
  },
];

export function renderVideos() {
  return `
    <section class="section videos" aria-labelledby="videos-title">
      <div class="container">
        <header class="section__header">
          <p class="section__label">Canal oficial</p>
          <h2 class="section__title" id="videos-title">Últimos Videos</h2>
          <p class="section__sub">Entrevistas, playlists y lo mejor de nuestro canal.</p>
        </header>

        <div class="cards" role="list">
          ${VIDEOS.map(v => `
            <article
              class="card"
              role="listitem"
              data-video-id="${escapeHtml(v.id)}"
              tabindex="0"
              aria-label="Reproducir: ${escapeHtml(v.title)}"
            >
              <div class="card__thumb">
                <img
                  class="card__img"
                  src="${escapeHtml(v.thumb)}"
                  alt="${escapeHtml(v.title)}"
                  width="480"
                  height="270"
                  loading="lazy"
                  decoding="async"
                />
                <div class="card__overlay" aria-hidden="true">
                  <div class="card__play-icon">▶</div>
                </div>
              </div>
              <div class="card__body">
                <h3 class="card__title">${escapeHtml(v.title)}</h3>
                <p class="card__meta">
                  <time>${escapeHtml(v.duration)}</time>
                </p>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
