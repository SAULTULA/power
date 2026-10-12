const RUTAS = ['home', 'videos', 'contacto', 'admin'];

export function parseHash(raw = '') {
  if (raw === '' || raw === '#') return { name: 'home' };
  if (!raw.startsWith('#/')) return null;
  const clean = raw.slice(2);
  const corte = clean.indexOf('?');
  const path = (corte === -1 ? clean : clean.slice(0, corte)).replace(/\/+$/, '');
  const query = corte === -1 ? '' : clean.slice(corte + 1);
  const name = RUTAS.includes(path) ? path : 'home';
  const params = Object.fromEntries(new URLSearchParams(query));
  return Object.keys(params).length ? { name, params } : { name };
}

export function buildHash(name) {
  return name === 'home' ? '#/' : `#/${name}`;
}

export function navigate(name) {
  location.hash = buildHash(RUTAS.includes(name) ? name : 'home');
}

export function onRouteChange(handler) {
  let inicial = true;
  const run = () => {
    const route = parseHash(location.hash);
    if (route) handler(route);
    else if (inicial) handler({ name: 'home' });
    inicial = false;
  };
  addEventListener('hashchange', run);
  run();
  return () => removeEventListener('hashchange', run);
}
