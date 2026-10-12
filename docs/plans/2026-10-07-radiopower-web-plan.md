# POWER 104.1 FM — Web llave en mano: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir una SPA estática, responsive y sin dependencias de runtime con reproductor de radio persistente, videos automáticos sin APIs, 20 espacios publicitarios y panel de administración para el cliente.

**Architecture:** Un único `index.html` con router por hash (`#/`, `#/videos`, `#/contacto`, `#/admin`). El `<audio>` se crea una vez fuera del outlet de rutas, por lo que navegar nunca lo recarga. Los videos de YouTube se leen de su RSS público en tiempo de build (`scripts/fetch-videos.mjs`) y se guardan en `data/videos.json`; Facebook se resuelve con el Page Plugin oficial y `plugins/video.php`. Los sponsors viven en `data/sponsors.json` y el panel `#/admin` los exporta para subir.

**Tech Stack:** HTML5 + CSS3 (Grid/Flex, clamp, backdrop-filter) + ES modules nativos. Node 22 para build, script de videos y tests con el runner integrado (`node --test`). Cero librerías de terceros.

**Diseño aprobado:** `docs/plans/2026-10-07-radiopower-web-design.md`

**Nota sobre commits:** el directorio no es un repositorio git. Cada tarea termina en un *checkpoint de verificación* en vez de un commit. Si se desea versionar, ejecutar `git init` una sola vez al inicio (opcional, preguntar al usuario).

---

## Convenciones

- Servidor local de verificación: `npx serve .` (puerto 3000) o `python -m http.server`.
- Tests: `node --test tests/` (runner nativo, sin instalar nada).
- Los tests validan la **lógica pura** (parseo de RSS, router, esquema de sponsors). La verificación visual es manual y se indica en cada tarea.
- Nunca usar `innerHTML` con datos de red sin escapar: `utils.escapeHtml()` obligatorio.

---

### Task 1: Scaffolding, configuración y assets

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `src/config.js`
- Create: `src/utils.js`
- Create: `.gitignore`
- Copy: `Logotipo circular POWER 104.1 FM.png` → `assets/img/logo.png`

**Step 1: Copiar el logo con nombre ASCII (evita problemas de URL con espacios y ñ)**

```powershell
New-Item -ItemType Directory -Force -Path assets\img, assets\img\sponsors, assets\css, src\views, data, scripts, tests, docs\plans | Out-Null
Copy-Item "Logotipo circular POWER 104.1 FM.png" "assets\img\logo.png"
```

**Step 2: Crear `package.json`**

```json
{
  "name": "power-104-fm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "videos": "node scripts/fetch-videos.mjs",
    "test": "node --test tests/",
    "build": "npm run videos",
    "serve": "npx --yes serve ."
  }
}
```

**Step 3: Crear `src/config.js`** (único archivo que el cliente toca para datos generales)

```js
export default {
  nombre: 'POWER 104.1 FM',
  eslogan: 'La señal que te mueve',
  stream: 'https://stream.ejemplo.com:8000/stream.mp3',
  streamFormato: 'audio/mpeg',
  adminPass: 'power2026',
  youtubeChannels: [
    { id: 'UC_REEMPLAZA_ESTE_ID', nombre: 'POWER 104.1 FM' }
  ],
  facebook: {
    page: 'https://www.facebook.com/tu-pagina',
    videos: []
  },
  contacto: {
    whatsapp: '5491100000000',
    email: 'contacto@power1041fm.com',
    direccion: 'Av. Principal 1041',
    horario: 'Lunes a viernes 6:00 a 22:00'
  },
  proxiesCORS: []
};
```

**Step 4: Crear `src/utils.js`**

```js
export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function safeFetch(url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn('[safeFetch]', url, err.message);
    return null;
  }
}

export function html(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
}

export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
```

**Step 5: Crear `index.html`** con el esqueleto de la SPA:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POWER 104.1 FM — Escuchá en vivo</title>
  <meta name="description" content="POWER 104.1 FM: escuchá la señal en vivo, videos, programas y contactanos." />
  <link rel="icon" href="assets/img/logo.png" />
  <link rel="preconnect" href="https://i.ytimg.com" />
  <link rel="stylesheet" href="assets/css/styles.css" />
  <script type="module" src="src/app.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header id="nav-root"></header>
  <main id="view" tabindex="-1"></main>
  <div id="player-root"></div>
  <div id="lightbox-root"></div>
</body>
</html>
```

**Step 6: Crear `.gitignore`**

```
node_modules/
.DS_Store
*.log
```

**Checkpoint:** `npx serve .` → carga sin errores en consola (aunque `src/app.js` todavía no existe, verificar que `index.html` responde 200).

**Errata Task 1** (cambios posteriores a la revisión; no reintroducirlos en tareas siguientes):

- Skip link usa `data-skip` + script inline en `index.html` (el router de Task 2 debe ignorar hashes que no empiecen con `#/`, así `#view` no roba la navegación).
- El helper `html` se eliminó de `src/utils.js`: usar `escapeHtml` + template strings normales.
- Favicons derivados: `assets/img/logo-32/80/180/512.png` (link 512 con `sizes="512x512"`, link 80 con `sizes="80x80"`).
- Dev server: `serve@14` (fijado en `package.json`).
- `safeFetch` implementado con timeout de 5 s.
- El `404` de `assets/css/styles.css` al servir es esperado hasta la Task 11.
- En Node 22 `node --test tests/` está roto (ejecuta el directorio como módulo): usar `npm test` / `node --test`; y `onRouteChange` renderiza `home` en la carga inicial si el hash no es ruta.

---

### Task 2: Router por hash (TDD)

**Files:**
- Create: `tests/router.test.mjs`
- Create: `src/router.js`

**Step 1: Escribir el test fallido**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, buildHash } from '../src/router.js';

test('parseHash normaliza rutas desconocidas a home', () => {
  assert.deepEqual(parseHash(''), { name: 'home' });
  assert.deepEqual(parseHash('#/'), { name: 'home' });
  assert.deepEqual(parseHash('#/videos'), { name: 'videos' });
  assert.deepEqual(parseHash('#/videos?id=abc'), { name: 'videos', params: { id: 'abc' } });
  assert.deepEqual(parseHash('#/inexistente'), { name: 'home' });
});

test('buildHash construye el hash', () => {
  assert.equal(buildHash('videos'), '#/videos');
  assert.equal(buildHash('home'), '#/');
});
```

**Step 2: Ejecutar y confirmar el fallo**

```
node --test tests/router.test.mjs
```
Esperado: FAIL (`Cannot find module '../src/router.js'`).

**Step 3: Implementar `src/router.js`**

```js
const RUTAS = ['home', 'videos', 'contacto', 'admin'];

export function parseHash(raw = '') {
  const clean = raw.replace(/^#\/?/, '');
  const [path, query = ''] = clean.split('?');
  const name = RUTAS.includes(path) ? path : 'home';
  const params = Object.fromEntries(new URLSearchParams(query));
  return Object.keys(params).length ? { name, params } : { name };
}

export function buildHash(name) {
  return name === 'home' ? '#/' : `#/${name}`;
}

export function navigate(name) {
  location.hash = buildHash(name);
}

export function onRouteChange(handler) {
  const run = () => handler(parseHash(location.hash));
  addEventListener('hashchange', run);
  run();
  return () => removeEventListener('hashchange', run);
}
```

**Step 4: Ejecutar y confirmar el pase**

```
node --test tests/router.test.mjs
```
Esperado: **PASS** (2 tests).

---

### Task 3: Shell de la app: navegación, outlet y ciclo de vida de vistas (TDD)

**Files:**
- Create: `tests/escape.test.mjs`
- Create: `src/app.js`
- Create: `src/views/home.js`, `src/views/videos.js`, `src/views/contacto.js`, `src/views/admin.js`

**Step 1: Test de escapado (seguridad XSS de datos remotos)**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../src/utils.js';

test('escapeHtml neutraliza etiquetas', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtml(`a&b'"`), 'a&amp;b&#039;&quot;'.replace('&quot;', '&quot;'));
});
```

```
node --test tests/escape.test.mjs   → PASS
```

**Step 2: Crear las vistas mínimas** (se ampliarán en Tasks 7-10). Cada vista exporta `render(params)` que devuelve HTML string y, opcionalmente, `mount()` para eventos.

```js
// src/views/videos.js
export function render() {
  return `<section class="vista"><h1>Videos</h1></section>`;
}
```
Repetir el patrón para `home.js`, `contacto.js`, `admin.js`.

**Step 3: Crear `src/app.js`**

```js
import config from './config.js';
import { onRouteChange, navigate } from './router.js';
import { escapeHtml } from './utils.js';
import { initPlayer } from './player.js';
import { renderNav } from './nav.js';

const view = document.getElementById('view');
const vistas = {
  home: () => import('./views/home.js'),
  videos: () => import('./views/videos.js'),
  contacto: () => import('./views/contacto.js'),
  admin: () => import('./views/admin.js')
};

let cleanupActual = null;

async function mostrar(route) {
  const mod = await (vistas[route.name] || vistas.home)();
  if (typeof cleanupActual === 'function') cleanupActual();
  view.innerHTML = mod.render(route.params || {});
  cleanupActual = typeof mod.mount === 'function' ? mod.mount() : null;
  view.focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('nav-root').innerHTML = renderNav();
initPlayer(document.getElementById('player-root'));
onRouteChange(mostrar);

document.addEventListener('click', e => {
  const a = e.target.closest('[data-nav]');
  if (!a) return;
  e.preventDefault();
  navigate(a.dataset.nav);
});

console.info(`${config.nombre} · app iniciada`);
```

**Step 4: Crear `src/nav.js`** (barra tipo Safari con backdrop-filter)

```js
import config from './config.js';
import { escapeHtml } from './utils.js';

const items = [
  ['home', 'Inicio'], ['videos', 'Videos'], ['contacto', 'Contacto']
];

export function renderNav() {
  return `
  <nav class="nav glass" aria-label="Principal">
    <a href="#/" data-nav="home" class="nav__marca">
      <img src="assets/img/logo.png" alt="${escapeHtml(config.nombre)}" width="40" height="40" />
      <span>${escapeHtml(config.nombre)}</span>
    </a>
    <ul class="nav__lista">
      ${items.map(([k, l]) => `<li><a href="#/${k === 'home' ? '' : k}" data-nav="${k}">${l}</a></li>`).join('')}
    </ul>
    <button class="nav__burger" aria-label="Abrir menú" aria-expanded="false">☰</button>
  </nav>`;
}
```

**Step 5: Verificación manual**

```
npx serve .
```
Esperado: navegar con `#/videos` y `#/contacto` cambia el contenido sin recargar (verificar en pestaña Network que no hay documento nuevo). Falta CSS y player (Tasks 4 y 10) → se ve sin estilo, es esperado.

---

### Task 4: Reproductor de audio persistente

**Files:**
- Create: `src/player.js`
- Modify: `assets/css/styles.css` (creado en Task 10 si aún no existe; en ese momento añadir `.player`)

**Step 1: Implementar `src/player.js`**

```js
import config from './config.js';
import { escapeHtml, prefersReducedMotion } from './utils.js';

const ESTADOS = { IDLE: 'idle', CONNECTING: 'connecting', PLAYING: 'playing', ERROR: 'error' };
let audio = null, estado = ESTADOS.IDLE, intentos = 0, ui = null;

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

function reproducir() {
  estado = ESTADOS.CONNECTING; pintar();
  audio.src = config.stream;
  audio.load();
  audio.play().then(() => {
    intentos = 0;
    estado = ESTADOS.PLAYING; pintar();
  }).catch(err => {
    console.warn('[player]', err.message);
    reintentar();
  });
}

function reintentar() {
  if (intentos >= 3) { estado = ESTADOS.ERROR; pintar(); return; }
  intentos++;
  estado = ESTADOS.CONNECTING; pintar();
  setTimeout(reproducir, 1000 * intentos);
}

export function initPlayer(root) {
  audio = new Audio();
  audio.preload = 'none';
  audio.crossOrigin = 'anonymous';

  root.innerHTML = `
    <div class="player glass" data-estado="idle" role="region" aria-label="Reproductor de radio en vivo">
      <button class="player__boton" aria-label="Reproducir">▶</button>
      <div class="player__meta">
        <strong class="player__marca">${escapeHtml(config.nombre)}</strong>
        <span class="player__estado">EN VIVO</span>
      </div>
      <div class="onda" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <label class="player__vol">
        <span class="sr-only">Volumen</span>
        <input type="range" min="0" max="1" step="0.05" value="${localStorage.getItem('vol') ?? 1}" />
      </label>
    </div>`;

  ui = {
    raiz: root.firstElementChild,
    boton: root.querySelector('.player__boton'),
    estado: root.querySelector('.player__estado'),
    onda: root.querySelector('.onda'),
    vol: root.querySelector('input[type=range]')
  };

  audio.volume = Number(ui.vol.value);
  ui.boton.onclick = () => {
    if (estado === ESTADOS.PLAYING) { audio.pause(); estado = ESTADOS.IDLE; pintar(); }
    else reproducir();
  };
  ui.vol.oninput = e => {
    audio.volume = e.target.value;
    localStorage.setItem('vol', e.target.value);
  };

  audio.addEventListener('stalled', () => { if (estado === ESTADOS.PLAYING) reintentar(); });
  audio.addEventListener('error', () => { estado = ESTADOS.ERROR; pintar(); });
  pintar();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', reproducir);
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
  }
}
```

**Step 2: Verificación manual (requisito duro)**

1. `npx serve .`, abrir DevTools → pestaña Network, filtrar por `Media`.
2. Pulsar play → el stream aparece y suena (con placeholder fallará; probar con `https://icecast.radiofrance.fr/fip-midfi.mp3` en `config.stream` solo para validar).
3. **Con el audio sonando**, navegar a `#/videos`, `#/contacto` y volver: el stream **no debe desaparecer de Network ni cortarse**.
4. Recargar la página → el audio se detiene (correcto: es una recarga real).

---

### Task 5: Datos y render de los 20 espacios publicitarios (TDD)

**Files:**
- Create: `data/sponsors.json`
- Create: `src/sponsors.js`
- Create: `tests/sponsors.test.mjs`

**Step 1: Test del validador/planificador de zonas**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planificarZonas, validar } from '../src/sponsors.js';
import readFileSync from 'node:fs';

const json = JSON.parse(readFileSync(new URL('../data/sponsors.json', import.meta.url)));

test('el archivo cumple el contrato y suma 20 espacios', () => {
  assert.equal(validar(json).ok, true);
  assert.equal(json.zonas.reduce((a, z) => a + z.max, 0), 20);
});

test('planificarZonas respeta max, orden y descarta inactivos', () => {
  const prueba = {
    zonas: [{ id: 'a', max: 1, formato: '300x100' }],
    spacers: [
      { id: 1, zona: 'a', activo: true, orden: 2, imagen: 'x.jpg' },
      { id: 2, zona: 'a', activo: true, orden: 1, imagen: 'y.jpg' },
      { id: 3, zona: 'a', activo: false, orden: 0, imagen: 'z.jpg' }
    ]
  };
  const out = planificarZonas(prueba).a;
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 2);
});
```

```
node --test tests/sponsors.test.mjs   → FAIL (módulo no existe)
```

**Step 2: Crear `data/sponsors.json`** con las 6 zonas y `spacers: []` (vacío al inicio; el cliente lo llena desde `#/admin`).

```json
{
  "zonas": [
    { "id": "header", "titulo": "Cabecera", "max": 1, "formato": "300x100" },
    { "id": "hero-lateral", "titulo": "Lateral hero", "max": 2, "formato": "300x250" },
    { "id": "entre-secciones", "titulo": "Mediana", "max": 6, "formato": "728x90" },
    { "id": "footer", "titulo": "Pie de página", "max": 4, "formato": "970x90" },
    { "id": "videos", "titulo": "En Videos", "max": 4, "formato": "300x250" },
    { "id": "contacto", "titulo": "En Contacto", "max": 3, "formato": "300x100" }
  ],
  "spacers": []
}
```

**Step 3: Implementar `src/sponsors.js`**

```js
import { escapeHtml, safeFetch } from './utils.js';

export function validar(json) {
  const errores = [];
  if (!json || !Array.isArray(json.zonas) || !Array.isArray(json.spacers))
    errores.push('estructura base ausente');
  json?.zonas?.forEach(z => {
    if (!z.id || !Number.isInteger(z.max) || z.max < 1) errores.push(`zona inválida: ${z.id}`);
  });
  const total = json?.zonas?.reduce((a, z) => a + z.max, 0);
  if (total !== 20) errores.push(`el total de espacios es ${total}, debe ser 20`);
  return { ok: errores.length === 0, errores };
}

export function planificarZonas(json) {
  const out = {};
  json.zonas.forEach(z => {
    out[z.id] = json.spacers
      .filter(s => s.zona === z.id && s.activo && s.imagen)
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
      .slice(0, z.max);
  });
  return out;
}

export function renderZona(zona, spacers = [], html = String) {
  if (!spacers.length) return '';
  return `<div class="zona zona--${zona.id}" aria-label="Espacio publicitario">
    ${spacers.map(s => `
      <a class="banner" href="${escapeHtml(s.enlace || '#')}" target="_blank" rel="noopener nofollow sponsored">
        <img src="${escapeHtml(s.imagen)}" alt="${escapeHtml(s.alt || 'Patrocinante')}"
             loading="lazy" decoding="async"
             onerror="this.closest('.banner').style.display='none'" />
      </a>`).join('')}
  </div>`;
}

export async function cargarSponsors() {
  const json = await safeFetch('data/sponsors.json') ||
    { zonas: [], spacers: [] };
  const v = validar(json);
  if (!v.ok) console.warn('[sponsors]', v.errores);
  return { json, zonas: planificarZonas(json) };
}
```

Ajustar la firma de `renderZona` a `renderZona(zona, spacers)` sin parámetro `html` extra si se prefiere; se mantiene simple.

**Step 4: Ejecutar el test**

```
node --test tests/sponsors.test.mjs
```
Esperado: **PASS** (2 tests). `validar` confirmará el total de 20 espacios.

---

### Task 6: Captura automática de videos de YouTube sin API (TDD)

**Files:**
- Create: `scripts/fetch-videos.mjs`
- Create: `tests/fixtures/youtube-feed.xml`
- Create: `tests/fetch-videos.test.mjs`
- Create: `data/videos.json`

**Step 1: Crear el fixture** `tests/fixtures/youtube-feed.xml` con un feed Atom real (copiar el contenido devuelto por `https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw`, recortado a 2 entradas `<entry>`).

**Step 2: Test del parser**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../scripts/fetch-videos.mjs';
import readFileSync from 'node:fs';

const xml = readFileSync(new URL('./fixtures/youtube-feed.xml', import.meta.url), 'utf8');

test('parseFeed extrae videoId, título, fecha y miniatura', () => {
  const items = parseFeed(xml);
  assert.ok(items.length >= 1);
  const it = items[0];
  assert.match(it.videoId, /^[\w-]{11}$/);
  assert.ok(it.titulo.length > 0);
  assert.ok(/^\d{4}-\d{2}-\d{2}/.test(it.fecha));
  assert.ok(it.miniatura.includes('i.ytimg.com'));
});
```

```
node --test tests/fetch-videos.test.mjs   → FAIL (export ausente)
```

**Step 3: Implementar `scripts/fetch-videos.mjs`**

```js
import { writeFile, mkdir, readFile } from 'node:fs/promises';

export function parseFeed(xml) {
  const entradas = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entradas.map(bloque => {
    const videoId = (bloque.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
    const titulo = (bloque.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? '';
    const fecha = (bloque.match(/<published>(.*?)<\/published>/) || [])[1] ?? '';
    const canal = (bloque.match(/<yt:channelId>([\w-]+)<\/yt:channelId>/) || [])[1] ?? '';
    if (!videoId) return null;
    return {
      videoId,
      titulo: titulo.trim(),
      fecha,
      canal,
      miniatura: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  }).filter(Boolean);
}

async function feedUrl(id) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
}

async function obtener() {
  const { default: config } = await import('../src/config.js');
  const todos = [];
  for (const canal of config.youtubeChannels) {
    try {
      const res = await fetch(feedUrl(canal.id), { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      parseFeed(await res.text()).slice(0, 12).forEach(v => todos.push({ ...v, fuente: canal.nombre }));
    } catch (e) {
      console.warn(`[videos] canal ${canal.id}: ${e.message}`);
    }
  }
  return todos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

const esEjecucionDirecta = process.argv[1]?.endsWith('fetch-videos.mjs');
if (esEjecucionDirecta) {
  const anteriores = await readFile('data/videos.json', 'utf8').then(JSON.parse).catch(() => []);
  const videos = await obtener();
  const finales = videos.length ? videos : anteriores;
  await mkdir('data', { recursive: true });
  await writeFile('data/videos.json', JSON.stringify({ actualizado: new Date().toISOString(), videos: finales }, null, 2));
  console.log(`[videos] ${finales.length} videos guardados`);
}
```

**Step 4: Ejecutar tests y el script**

```
node --test tests/fetch-videos.test.mjs     → PASS
node scripts/fetch-videos.mjs                → "[videos] 0 videos guardados" (placeholder de canal)
```
Verificar que `data/videos.json` se creó. Para probar con contenido real, poner el `channel_id` real del cliente o usar `UC_x5XG1OV2P6uZZ5FSM9Ttw` temporalmente.

**Step 5: Commit / checkpoint**

---

### Task 7: Vista Inicio (landing completa)

**Files:**
- Modify: `src/views/home.js`

**Estructura de la vista** (HTML completo con las zonas de sponsors integradas):

```js
import config from '../config.js';
import { escapeHtml } from '../utils.js';
import { cargarSponsors, renderZona } from '../sponsors.js';
import { safeFetch } from '../utils.js';

export async function render() {
  const { json, zonas } = await cargarSponsors();
  const { videos = [] } = (await safeFetch('data/videos.json')) ?? {};

  return `
  <section class="hero">
    <div class="hero__texto">
      <p class="eyebrow">Ahora al aire</p>
      <h1>${escapeHtml(config.nombre)}</h1>
      <p class="hero__sub">${escapeHtml(config.eslogan)}</p>
      <button class="btn btn--primario" data-play>Escuchar en vivo</button>
    </div>
    <div class="hero__visual"><img src="assets/img/logo.png" alt="Logo ${escapeHtml(config.nombre)}" /></div>
  </section>

  ${renderZona('hero-lateral', zonas['hero-lateral'])}

  <section class="seccion">
    <h2>Últimos videos</h2>
    <div class="grid grid--videos">
      ${videos.slice(0, 6).map(v => `
        <article class="tarjeta">
          <button class="tarjeta__thumb" data-video="${v.videoId}"
            aria-label="Reproducir ${escapeHtml(v.titulo)}">
            <img src="${escapeHtml(v.miniatura)}" alt="" loading="lazy" decoding="async" />
            <span class="play">▶</span>
          </button>
          <h3>${escapeHtml(v.titulo)}</h3>
        </article>`).join('') || '<p class="vacio">Pronto publicaremos videos.</p>'}
    </div>
    <a class="btn btn--secundario" data-nav="videos">Ver todos los videos</a>
  </section>

  ${renderZona('entre-secciones', zonas['entre-secciones'])}

  <section class="seccion seccion--oscura">
    <h2>Contacto y publicidad</h2>
    <p>¿Querés pautar en ${escapeHtml(config.nombre)}?</p>
    <a class="btn btn--primario" data-nav="contacto">Escribinos</a>
  </section>

  ${renderZona('footer', zonas['footer'])}`;
}

export function mount() {
  const off = document.addEventListener('click', e => {
    if (e.target.closest('[data-play]')) document.querySelector('.player__boton')?.click();
    const vid = e.target.closest('[data-video]');
    if (vid) import('../lightbox.js').then(m => m.abrirVideo(vid.dataset.video));
  });
  return () => {};
}
```

*Nota de implementación:* el `mount()` debe registrar el listener en el propio nodo `#view` y devolver la función que lo remueve (no usar listener global anónimo). Ajustar al implementar.

**Verificación:** la home muestra hero, grilla de videos (vacía con mensaje amable si no hay JSON) y las zonas de sponsors vacías sin dejar huecos visibles.

---

### Task 8: Vista Videos (YouTube automático + Facebook sin API)

**Files:**
- Create: `src/lightbox.js`
- Modify: `src/views/videos.js`

**Step 1: `src/lightbox.js`**

```js
export function abrirVideo(videoId) {
  const root = document.getElementById('lightbox-root');
  root.innerHTML = `
    <div class="lightbox" role="dialog" aria-modal="true" aria-label="Reproductor de video">
      <button class="lightbox__cerrar" aria-label="Cerrar">✕</button>
      <div class="lightbox__frame">
        <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1"
          title="Video" allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>
      </div>
    </div>`;
  const cerrar = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') cerrar(); };
  root.querySelector('.lightbox__cerrar').onclick = cerrar;
  root.querySelector('.lightbox').onclick = e => { if (e.target.classList.contains('lightbox')) cerrar(); };
  document.addEventListener('keydown', onKey);
}
```

**Step 2: `src/views/videos.js`**

- Cabecera con h1 "Videos".
- Grilla con los videos de `data/videos.json` (miniatura + lightbox).
- Bloque **Facebook**: iframe del Page Plugin oficial:
  ```html
  <iframe src="https://www.facebook.com/plugins/page.php?href=ENLACE_PAGINA&tabs=timeline&width=340&height=500&adapt_container_width=true"
    width="340" height="500" style="border:none;overflow:hidden" loading="lazy"
    allow="encrypted-media" title="Facebook de la emisora"></iframe>
  ```
- Grilla de videos de Facebook que el cliente registró en `#/admin` (`config.facebook.videos`), incrustados con:
  ```html
  <iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false"
    width="400" height="225" style="border:none;overflow:hidden" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>
  ```
- Zona de sponsors `videos`.

**Verificación:** los videos de YouTube abren en lightbox sin cortar la radio; el Page Plugin carga (puede tardar o bloquearse en local según red → documentar).

---

### Task 9: Vista Contacto + SEO

**Files:**
- Modify: `src/views/contacto.js`
- Modify: `index.html` (JSON-LD)

**Step 1:** Tarjetas con WhatsApp (`https://wa.me/<numero>`), email (`mailto:`), dirección, horario. Formulario de contacto que usa `mailto:` (sin backend) o un Formspree/Netlify Forms si se configura; por defecto `mailto:` + botón de WhatsApp, evitando prometer envío real sin backend.

**Step 2: Añadir a `index.html`** en `<head>`:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"RadioStation","name":"POWER 104.1 FM",
 "url":"https://tu-dominio.com","frequency":"104.1 FM","broadcastAffiliateOf":"POWER FM"}
</script>
```

---

### Task 10: Panel de administración `#/admin`

**Files:**
- Create: `src/views/admin.js`

**Funcionalidad:**

1. Pantalla de acceso: input de contraseña comparada contra `config.adminPass` (en memoria, sin persistir salvo flag en `sessionStorage`).
2. Editor por zona: para cada una de las 6 zonas, lista sus casillas (`max`) con:
   - `input[type=file]` → lee con `FileReader` a base64, previsualiza.
   - input URL de enlace, input alt, número de orden, checkbox activo.
3. Bloque "Videos de Facebook": textarea (una URL por línea) que se escribe en `config.facebook.videos` en memoria.
4. Barra de acciones:
   - **Previsualizar**: aplica los cambios en memoria y navega a `#/` para ver el resultado.
   - **Descargar sponsors.json**: `Blob` + `<a download>`.
   - **Restaurar**: descarta cambios.
5. Guardar el estado del editor en `localStorage` para no perder trabajo a medio camino.

**Esqueleto clave:**

```js
import config from '../config.js';
import { cargarSponsors } from '../sponsors.js';

let estado = null;

export function render() {
  return `<section class="admin">
    <h1>Panel de patrocinantes</h1>
    <div id="admin-acceso"></div>
    <div id="admin-cuerpo" hidden></div>
  </section>`;
}

export function mount() { /* pinta acceso → tras validar, pinta editor */ }
// descargarJSON(): Blob(JSON.stringify(estado, null, 2), {type:'application/json'})
```

**Verificación:** sin contraseña no se accede; con contraseña se cargan los datos actuales; subir imagen, descargar JSON y comprobar que `data/sponsors.json` resultante sigue pasando `node --test tests/sponsors.test.mjs`.

---

### Task 11: Sistema de diseño (estilo Apple) y responsive

**Files:**
- Create: `assets/css/styles.css`

**Contenido (por este orden):**

1. **Tokens y reset**
```css
:root{
  --bg:#f5f5f7; -- superficie:#fff; --texto:#1d1d1f; --texto-suat:#6e6e73;
  --acento:#e8112d; --radio:22px;
  --sombra:0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06);
  --fuente:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;
  --ease:cubic-bezier(.28,.11,.32,1);
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:var(--fuente);background:var(--bg);color:var(--texto);
  -webkit-font-smoothing:antialiased;line-height:1.5}
```
*(corregir el espacio accidental en `--superficie` al escribir el archivo)*

2. **Utilidades**: `.sr-only`, `.skip-link`, `.glass` (blur), `.btn` (`--primario` rojo, `--secundario` outline), `.eyebrow`, `.tarjeta`, `.grid`.

3. **Nav**: posición sticky, `backdrop-filter: blur(20px) saturate(180%)`, borde inferior de 1px translúcido; menú hamburguesa bajo 768px con `max-height` transition.

4. **Hero**: tipografía `clamp(2.5rem, 7vw, 5.5rem)`, tracking `-0.02em`, fondo oscuro (`#1d1d1f`) con logo grande, en dos columnas hasta 900px.

5. **Player**: `position:fixed; bottom:16px; left:50%; transform:translateX(-50%)`, radio completo, sombra pronunciada, onda con 4 `<i>` animados (`@keyframes` alturas). En ≤640px: solo botón + estado, volumen colapsado.

6. **Zonas de sponsors**: `.zona{display:grid;gap:16px}` con `grid-template-columns: repeat(auto-fit,minmax(160px,1fr))`; en móvil la zona `entre-secciones` pasa a `display:flex; overflow-x:auto; scroll-snap-type:x mandatory`.

7. **Lightbox**: overlay `rgba(0,0,0,.85)`, iframe 16:9 centrado, `animation` de entrada 200ms.

8. **Responsive**: media queries en 640px y 1024px; `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`.

9. **Accesibilidad**: `:focus-visible{outline:2px solid var(--acento); outline-offset:3px}`, contraste AA verificado (texto `#1d1d1f` sobre `#f5f5f7`; rojo `#e8112d` solo sobre blanco en tamaños ≥16px bold).

**Verificación:** revisar las 3 vistas en 360px, 768px y 1440px (DevTools responsive mode).

---

### Task 12: Deploy, cron de videos y documentación del cliente

**Files:**
- Create: `netlify.toml`
- Create: `vercel.json`
- Create: `README.md`
- Create: `docs/GUIA-DEL-CLIENTE.md`

**Step 1: `netlify.toml`**

```toml
[build]
  command = "npm run videos"
  publish = "."
```

**Step 2: `vercel.json`**

```json
{
  "buildCommand": "npm run videos",
  "outputDirectory": ".",
  "crons": [{ "path": "/api/rebuild", "schedule": "0 6 * * *" }]
}
```
*(El cron de Vercel requiere un endpoint que dispare un rebuild; documentar alternativa con GitHub Actions `schedule` que haga `git commit --allow-empty`. Para GitHub Pages usar workflow con `on: schedule: - cron: '0 6 * * *'` que re-ejecuta `npm run videos` y commitea `data/videos.json`.)*

**Step 3: `README.md`** con: qué es, estructura, despliegue en 3 pasos (arrastrar carpeta a Netlify / `vercel deploy` / GitHub Pages), cómo configurar `src/config.js`.

**Step 4: `docs/GUIA-DEL-CLIENTE.md`** con:
1. Cambiar la URL del stream.
2. Cambiar sponsors (entrar a `#/admin`, contraseña, editar, descargar, subir `data/sponsors.json`).
3. Agregar un canal de YouTube (copiar el `channel_id` de la URL del canal).
4. Agregar videos de Facebook (pegar URLs en el panel) y qué NO es posible automático.
5. Actualización automática de videos (cron diario).

---

## Verificación final (criterios de aceptación)

```powershell
node --test tests/          # todos los tests en verde
node scripts/fetch-videos.mjs
npx serve .                 # prueba manual
```

Checklist:
- [ ] El audio sigue sonando al navegar entre `#/`, `#/videos`, `#/contacto`.
- [ ] `data/videos.json` se genera solo desde el RSS de YouTube.
- [ ] `data/sponsors.json` suma exactamente 20 espacios y pasa el validador.
- [ ] `#/admin` exporta un JSON válido que el validador acepta.
- [ ] Responsive correcto a 360 / 768 / 1440 px.
- [ ] Sin errores de consola y sin requests fallidos en las 3 vistas.
- [ ] Lighthouse ≥ 90 en Performance / Accesibilidad / SEO.
