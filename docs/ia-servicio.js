/* AI model audit · Conector con el servicio de IA (Cloudflare Worker + Gemini).
   La clave de Gemini vive solo en el Worker; esta página nunca la ve.
   Expone window.AMA_IA con la misma forma que usa la demo: disponible() y json(prompt, {signal}). */
window.AMA_IA = (() => {
  const URL_IA = 'https://ai-model-audit-ia.manuelzv150.workers.dev';
  let estado = null, modelo = '';

  async function disponible() {
    if (estado !== null) return estado;
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(URL_IA + '/salud', { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      estado = !!j.ok; modelo = j.modelo || '';
    } catch (e) { estado = false; }
    return estado;
  }

  function normalizar(v) {
    // Si el modelo envuelve el arreglo en un objeto ({"reglas":[...]}), se devuelve el arreglo.
    if (!Array.isArray(v) && v && typeof v === 'object') {
      const arrs = Object.values(v).filter(Array.isArray);
      if (arrs.length === 1) return arrs[0];
    }
    return v;
  }

  async function json(prompt, { signal } = {}) {
    const r = await fetch(URL_IA + '/reglas', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const b = await r.json().catch(() => ({}));
    if (!r.ok || !b.ok) throw { code: r.status === 429 ? 'rate_limited' : 'error', message: b.error || ('HTTP ' + r.status) };
    const raw = String(b.texto || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    try { return normalizar(JSON.parse(raw)); } catch (e) { throw { code: 'invalid_json' }; }
  }

  return { url: URL_IA, proveedor: 'Gemini', disponible, json, get modelo() { return modelo; } };
})();
