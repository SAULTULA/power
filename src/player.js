import config from './config.js';
import { escapeHtml, prefersReducedMotion } from './utils.js';

const ESTADOS = { IDLE: 'idle', CONNECTING: 'connecting', PLAYING: 'playing', ERROR: 'error' };
let audio = null, estado = ESTADOS.IDLE, intentos = 0, ui = null;
let reintento = null, tokenIntento = 0;

function leerVol() {
  try {
    const crudo = localStorage.getItem('vol');
    if (crudo === null || crudo.trim() === '') return 1;
    const n = Number(crudo);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
  } catch {
    return 1;
  }
}

function guardarVol(valor) {
  try { localStorage.setItem('vol', String(valor)); } catch {}
}

function cancelarReintento() {
  if (reintento !== null) {
    clearTimeout(reintento);
    reintento = null;
  }
}

function pintar() {
  if (!ui) return;
  ui.boton.textContent = estado === ESTADOS.PLAYING ? '❚❚' : '▶';
  ui.boton.setAttribute('aria-label',
    estado === ESTADOS.PLAYING ? 'Pausar la señal en vivo' : 'Reproducir la señal en vivo');
  ui.estado.textContent =
    estado === ESTADOS.PLAYING ? 'EN VIVO' :
    estado === ESTADOS.CONNECTING ? 'CONECTANDO…' : 'SEÑAL NO DISPONIBLE';
  ui.raiz.dataset.estado = estado;
  ui.onda.classList.toggle('onda--activa',
    estado === ESTADOS.PLAYING && !prefersReducedMotion());
}

function iniciar() {
  cancelarReintento();
  intentos = 0;
  reproducir();
}

function pausar() {
  tokenIntento++;
  cancelarReintento();
  intentos = 0;
  audio.pause();
  estado = ESTADOS.IDLE;
  pintar();
}

function reproducir() {
  cancelarReintento();
  const token = ++tokenIntento;
  estado = ESTADOS.CONNECTING;
  pintar();
  audio.src = config.stream;
  audio.load();
  audio.play().then(() => {
    if (token !== tokenIntento) return;
    intentos = 0;
    estado = ESTADOS.PLAYING;
    pintar();
  }).catch(err => {
    if (token !== tokenIntento) return;
    console.warn('[player]', err.message);
    reintentar();
  });
}

function reintentar() {
  if (reintento !== null) return;
  if (intentos >= 3) { estado = ESTADOS.ERROR; pintar(); return; }
  intentos++;
  estado = ESTADOS.CONNECTING;
  pintar();
  reintento = setTimeout(() => {
    reintento = null;
    if (estado === ESTADOS.IDLE) return;
    reproducir();
  }, 1000 * intentos);
}

export function initPlayer(root) {
  if (!root) return;
  if (ui && ui.raiz.isConnected) return;
  if (audio) { tokenIntento++; cancelarReintento(); audio.pause(); }

  const vol = leerVol();

  audio = new Audio();
  audio.preload = 'none';
  audio.setAttribute('type', config.streamFormato);
  if (!audio.canPlayType(config.streamFormato)) {
    console.warn('[player] formato no soportado:', config.streamFormato);
  }

  root.innerHTML = `
    <div class="player" data-estado="idle" role="region" aria-label="Reproductor de radio en vivo">
      <div class="player__inner">
        <button class="player__boton" aria-label="Reproducir">▶</button>
        <div class="player__meta">
          <strong class="player__marca">${escapeHtml(config.nombre)}</strong>
          <span class="player__estado">EN VIVO</span>
        </div>
        <div class="player__right">
          <div class="onda" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <label class="player__vol">
            <span class="sr-only">Volumen</span>
            <input type="range" min="0" max="1" step="0.05" value="${vol}" />
          </label>
        </div>
      </div>
    </div>`;


  ui = {
    raiz: root.querySelector('[data-estado]'),
    boton: root.querySelector('.player__boton'),
    estado: root.querySelector('.player__estado'),
    onda: root.querySelector('.onda'),
    vol: root.querySelector('input[type=range]')
  };

  audio.volume = vol;
  ui.boton.onclick = () => {
    if (estado === ESTADOS.PLAYING) pausar();
    else iniciar();
  };
  ui.vol.oninput = e => {
    const v = Math.min(1, Math.max(0, Number(e.target.value) || 0));
    audio.volume = v;
    guardarVol(v);
  };

  audio.addEventListener('stalled', () => { if (estado === ESTADOS.PLAYING) reintentar(); });
  audio.addEventListener('error', () => { estado = ESTADOS.ERROR; pintar(); });
  pintar();

  if ('mediaSession' in navigator) {
    const fijar = (accion, fn) => {
      try { navigator.mediaSession.setActionHandler(accion, fn); } catch {}
    };
    fijar('play', iniciar);
    fijar('pause', pausar);
  }
}
