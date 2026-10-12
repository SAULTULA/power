import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, buildHash, navigate, onRouteChange } from '../src/router.js';

function conBrowser(hash, fn) {
  const claves = ['location', 'addEventListener', 'removeEventListener'];
  const previo = claves.map((clave) => [clave, clave in globalThis, globalThis[clave]]);
  const oyentes = [];
  globalThis.location = { hash };
  globalThis.addEventListener = (tipo, cb) => {
    if (tipo === 'hashchange') oyentes.push(cb);
  };
  globalThis.removeEventListener = (tipo, cb) => {
    const i = oyentes.indexOf(cb);
    if (i !== -1) oyentes.splice(i, 1);
  };
  try {
    fn({
      oyentes,
      cambiarHash: (nuevo) => { globalThis.location.hash = nuevo; },
      emitir: () => oyentes.slice().forEach((cb) => cb()),
    });
  } finally {
    previo.forEach(([clave, existia, valor]) => {
      if (existia) globalThis[clave] = valor;
      else delete globalThis[clave];
    });
  }
}

test('parseHash normaliza rutas desconocidas a home', () => {
  assert.deepEqual(parseHash(''), { name: 'home' });
  assert.deepEqual(parseHash('#'), { name: 'home' });
  assert.deepEqual(parseHash('#/'), { name: 'home' });
  assert.deepEqual(parseHash('#/videos'), { name: 'videos' });
  assert.deepEqual(parseHash('#/videos?id=abc'), { name: 'videos', params: { id: 'abc' } });
  assert.deepEqual(parseHash('#/inexistente'), { name: 'home' });
});

test('parseHash ignora anchors del navegador que no son rutas', () => {
  assert.equal(parseHash('#view'), null);
  assert.equal(parseHash('#main'), null);
});

test('parseHash tolera barra final en la ruta', () => {
  assert.deepEqual(parseHash('#/videos/'), { name: 'videos' });
  assert.deepEqual(parseHash('#/videos/?id=abc'), { name: 'videos', params: { id: 'abc' } });
  assert.deepEqual(parseHash('#/inexistente/'), { name: 'home' });
});

test('parseHash parte la query en el primer signo de interrogacion', () => {
  assert.deepEqual(parseHash('#/videos?q=a?b'), { name: 'videos', params: { q: 'a?b' } });
  assert.deepEqual(parseHash('#/videos?q=1?x=2&z=3'), { name: 'videos', params: { q: '1?x=2', z: '3' } });
});

test('buildHash construye el hash', () => {
  assert.equal(buildHash('videos'), '#/videos');
  assert.equal(buildHash('home'), '#/');
});

test('navigate valida el nombre y cae en home ante rutas desconocidas', () => {
  conBrowser('', () => {
    navigate('videos');
    assert.equal(globalThis.location.hash, '#/videos');
    navigate('contacto');
    assert.equal(globalThis.location.hash, '#/contacto');
    navigate('nope');
    assert.equal(globalThis.location.hash, '#/');
    navigate('home');
    assert.equal(globalThis.location.hash, '#/');
  });
});

test('onRouteChange invoca el handler sincronamente al suscribirse', () => {
  conBrowser('', ({ oyentes }) => {
    const llamadas = [];
    const off = onRouteChange((ruta) => llamadas.push(ruta));
    assert.deepEqual(llamadas, [{ name: 'home' }]);
    assert.equal(oyentes.length, 1);
    off();
  });
});

test('onRouteChange renderiza home en la carga inicial ante un hash que no es ruta', () => {
  for (const hash of ['#view', '#videos', '##/videos']) {
    conBrowser(hash, () => {
      const llamadas = [];
      onRouteChange((ruta) => llamadas.push(ruta));
      assert.deepEqual(llamadas, [{ name: 'home' }], `hash inicial ${hash}`);
    });
  }
});

test('onRouteChange ignora anchors no-ruta en hashchange', () => {
  conBrowser('#/videos', ({ cambiarHash, emitir }) => {
    const llamadas = [];
    onRouteChange((ruta) => llamadas.push(ruta));
    assert.deepEqual(llamadas, [{ name: 'videos' }]);
    cambiarHash('#view');
    emitir();
    cambiarHash('#main');
    emitir();
    assert.equal(llamadas.length, 1);
  });
});

test('onRouteChange reacciona a cambios de hash validos', () => {
  conBrowser('', ({ cambiarHash, emitir }) => {
    const llamadas = [];
    onRouteChange((ruta) => llamadas.push(ruta));
    cambiarHash('#/videos');
    emitir();
    assert.deepEqual(llamadas, [{ name: 'home' }, { name: 'videos' }]);
    cambiarHash('#/videos?id=abc');
    emitir();
    assert.deepEqual(llamadas[2], { name: 'videos', params: { id: 'abc' } });
  });
});

test('onRouteChange deja de notificar tras cancelar la suscripcion', () => {
  conBrowser('', ({ cambiarHash, emitir, oyentes }) => {
    const llamadas = [];
    const off = onRouteChange((ruta) => llamadas.push(ruta));
    off();
    assert.equal(oyentes.length, 0);
    cambiarHash('#/videos');
    emitir();
    assert.deepEqual(llamadas, [{ name: 'home' }]);
  });
});
