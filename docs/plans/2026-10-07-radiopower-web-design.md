# Diseño: Web llave en mano para POWER 104.1 FM

Fecha: 2026-10-07
Estado: Aprobado por el cliente

## 1. Contexto y restricciones

- Cliente: emisora **POWER 104.1 FM** (logo circular en `Logotipo circular POWER 104.1 FM.png`).
- Paleta extraída del logo: negro `#000000`, blanco `#FFFFFF`, rojo `#FF0000`.
- Alojamiento elegido: **hosting estático** (Netlify / Vercel / GitHub Pages). Sin base de datos, sin backend.
- Sin API keys de Meta ni de Google: los videos deben leerse por alternativas sin tokens.
- Requisitos duros del brief:
  1. Reproductor de streaming MP3/AAC persistente (sin cortes al navegar).
  2. Videos automáticos de YouTube y Facebook sin APIs oficiales.
  3. 20 espacios publicitarios con gestión autónoma por el cliente.
  4. 100% responsive, código limpio, moderno y liviano.
- El stream todavía no existe → URL configurable con placeholder.

## 2. Enfoque de arquitectura elegido

Se descartaron:

| Opción | Motivo de descarte |
|---|---|
| A) Múltiples páginas HTML | El audio se corta en cada navegación (requiere iframe hack) y duplica header/footer. |
| C) Vite + Preact/React | Añade `node_modules` y paso de build; empeora la entrega llave en mano para el cliente. |

**Adoptado: B) SPA ligera con router por hash y JavaScript nativo (sin frameworks).**

- `index.html` único; el `<audio>` vive fuera del outlet de rutas → navegación jamás lo recarga.
- Router por hash: `#/`, `#/videos`, `#/contacto`, `#/admin`.
- 0 dependencias en tiempo de ejecución, ES modules nativos.

## 3. Estructura de archivos

```
radio-power/
├─ index.html                  # SPA única (HTML base, meta, SEO, JSON-LD)
├─ netlify.toml | vercel.json  # deploy + cron de rebuild diario
├─ package.json                # scripts: build, fetch-videos, serve
├─ scripts/
│  └─ fetch-videos.mjs         # lee RSS de YouTube en build → data/videos.json
├─ data/
│  ├─ sponsors.json            # 20 espacios (lo edita el cliente)
│  └─ videos.json              # generado automáticamente en build
├─ assets/
│  ├─ logo.png
│  ├─ img/sponsors/            # banners del cliente
│  └─ css/  js/
├─ src/
│  ├─ config.js                # stream URL, canales YT, URL FB, colores, contacto
│  ├─ app.js                   # arranque + router
│  ├─ router.js
│  ├─ player.js                # <audio> persistente + UI flotante
│  ├─ views/                   # home.js, videos.js, contacto.js, admin.js
│  ├─ sponsors.js              # render de las 20 zonas
│  └─ utils.js                 # safeFetch, lazy-load, formateo
└─ docs/
   └─ GUIA-DEL-CLIENTE.md
```

## 4. Reproductor persistente

- Un único `<audio id="live-audio">` creado una vez en `app.js`, fuera de `#view`.
- UI flotante fija abajo: logo, botón play, indicador EN VIVO, onda animada, volumen.
- En móvil se colapsa a botón redondo expandible.
- Máquina de estados: `idle → connecting → playing → buffering → error`, con reintento por backoff (3 intentos).
- `preload="none"`; volumen persistido en `localStorage`; `MediaSession API` para controles del sistema.
- URL del stream en `src/config.js` con placeholder.

## 5. Videos sin APIs

### YouTube (automático)
- Fuente: RSS público `https://www.youtube.com/feeds/videos.xml?channel_id=…` (sin API key, sin expiración).
- Verificado en 2026-10-07: responde 200, pero **sin cabecera `Access-Control-Allow-Origin`** → no es consumible desde el navegador.
- Por tanto: `scripts/fetch-videos.mjs` corre **en el build** de Netlify/Vercel/GitHub Actions (Node 18+, `fetch` nativo, sin CORS), parsea XML y escribe `data/videos.json` con `titulo`, `videoId`, `fecha`, `miniatura`.
- Un **cron diario** re-ejecuta el build → actualización automática sin tocar nada.
- Fallback en runtime: lista de proxies CORS configurable en `config.js`, intentados en orden (hoy caídos, se documenta como opcional).

### Facebook (limitación real documentada)
- Facebook **no ofrece RSS público** ni lectura sin token oficial. Alternativas sin API key:
  1. **Page Plugin oficial** (`facebook.com/plugins/page.php?href=…`) → iframe oficial, gratis, sin token, muestra el timeline.
  2. **`facebook.com/plugins/video.php?href=…`** → el cliente pega URLs de videos en el panel admin y aparecen en la grilla.
- Queda explícito en `GUIA-DEL-CLIENTE.md`: la lectura automática total de Facebook no existe sin la API oficial de Meta.

### Reproducción
- Lightbox con `youtube-nocookie.com`, `loading="lazy"`.
- El audio de la radio sigue corriendo (pistas independientes).

## 6. Monetización: 20 espacios + panel

### `data/sponsors.json`
```json
{
  "zonas": [
    { "id":"header",           "titulo":"Cabecera",        "max":1, "formato":"300x100" },
    { "id":"hero-lateral",     "titulo":"Lateral hero",    "max":2, "formato":"300x250" },
    { "id":"entre-secciones",  "titulo":"Mediana",         "max":6, "formato":"728x90"  },
    { "id":"footer",           "titulo":"Pie de página",   "max":4, "formato":"970x90"  },
    { "id":"videos",           "titulo":"En Videos",       "max":4, "formato":"300x250" },
    { "id":"contacto",         "titulo":"En Contacto",     "max":3, "formato":"300x100" }
  ],
  "spacers": [
    { "id":1, "zona":"hero-lateral", "imagen":"assets/img/sponsors/1.jpg",
      "enlace":"https://…", "alt":"…", "activo":true, "orden":1 }
  ]
}
```
- Total de zonas: 1+2+6+4+4+3 = **20 espacios**.
- Espacio vacío o inactivo → no se renderiza (sin huecos visibles).
- Imágenes con `loading="lazy"`, `decoding="async"`.

### Panel `#/admin`
- Ruta oculta, protegida por contraseña simple definida en `config.js`
  (seguridad cosmética: en hosting estático no puede ser otra cosa).
- Formulario visual con las 20 casillas por zona: arrastrar/soltar imagen (previsualización base64 en `localStorage`), enlace, alt, orden, toggle activo.
- Bloque extra: URLs de videos de Facebook.
- Acciones: **previsualización en vivo**, **Descargar sponsors.json**, **Restaurar**.
- El cliente sube el JSON por FTP/Git y queda publicado.
- Hoja de ruta documentada: con Netlify se puede conectar Form + Build Hook para guardado 100% en línea sin rehacer el panel.

## 7. Diseño visual (inspiración Apple)

- Tipografía: pila de sistema `-apple-system, "SF Pro Text", "Segoe UI", Inter`.
- Títulos grandes con `clamp()`, peso 700, tracking negativo.
- Tarjetas blancas, radio 20-24px, sombras suaves `0 1px 2px` + `0 8px 24px rgba(0,0,0,.06)`.
- Nav flotante tipo Safari: `backdrop-filter: blur(20px)`, fondo translúcido.
- Acento rojo `#E8112D` para acciones primarias y el indicador EN VIVO; base `#F5F5F7` con hero oscuro.
- Movimiento 300-500ms con `cubic-bezier(.28,.11,.32,1)`; respeta `prefers-reduced-motion`.
- Logo circular original sin recortar.

## 8. Responsive

- ≤640px: 1 columna, sponsors en carrusel horizontal, player colapsado.
- ≤1024px: 2 columnas, videos 2-up.
- Desktop: videos 3-4-up, banners en fila.
- Grid + Flexbox con `auto-fit/minmax`; sin `!important`.

## 9. Manejo de errores

- JSON ausente o corrupto → vista vacía con fallback, app no se rompe.
- Stream caído → backoff + estado visible.
- Imagen rota → placeholder neutro vía `onerror`.
- Todo acceso a red envuelto en `utils.safeFetch()` con `try/catch`.

## 10. Testing / aceptación

- Servidor local (`npx serve`) y prueba manual de las 3 vistas, el player y el panel.
- Prueba explícita: navegar con audio sonando **no debe cortarlo**.
- Accesibilidad: `alt`, `aria-label` en controles, contraste AA, foco visible.
- Lighthouse (performance / SEO / accesibilidad) como criterio de aceptación.

## 11. Entrega

- `README.md`: despliegue en Netlify/Vercel/GitHub Pages en 3 pasos.
- `docs/GUIA-DEL-CLIENTE.md`: cambiar stream, cambiar sponsors, agregar canales de YouTube, agregar videos de Facebook.
- `netlify.toml` / `vercel.json` con build + cron diario.
