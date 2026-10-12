export function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function safeFetch(url, opts = {}) {
  const timeout = (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
    ? { signal: AbortSignal.timeout(5000) }
    : {};
  try {
    const r = await fetch(url, { ...timeout, ...opts });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn('[safeFetch]', url, err.message);
    return null;
  }
}

export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
