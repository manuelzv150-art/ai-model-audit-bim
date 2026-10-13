/**
 * AI model audit · Servicio IA (Cloudflare Worker)
 * Intermediario entre la demo (GitHub Pages) y Gemini. La clave nunca llega al navegador.
 *
 * Rutas
 *   GET  /salud            -> estado del servicio (sin gastar tokens)
 *   GET  /salud?probar=1   -> hace una llamada mínima a Gemini para comprobar la clave
 *   POST /reglas           -> { prompt }  propone reglas; responde { texto, uso, modelo }
 *   POST /redactar         -> { prompt }  redacta observaciones; responde { texto, uso, modelo }
 *
 * Variables del Worker (Settings -> Variables and Secrets)
 *   GEMINI_API_KEY  (Secret, obligatoria)  clave de Google AI Studio
 *   GEMINI_MODEL    (Text, opcional)       por defecto "gemini-3.5-flash-lite"
 *   ORIGENES        (Text, opcional)       orígenes extra permitidos, separados por coma
 */

const ORIGENES_BASE = [
  "https://manuelzv150-art.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];
const MAX_PROMPT = 60000;       // caracteres (≈ lo que dice el deck: ≤60 000)
const LIMITE_POR_MINUTO = 10;   // solicitudes por IP y por minuto
const visitas = new Map();      // límite aproximado por instancia

function origenesPermitidos(env) {
  const extra = (env.ORIGENES || "").split(",").map(s => s.trim()).filter(Boolean);
  return [...ORIGENES_BASE, ...extra];
}

function cors(origin, env) {
  const ok = origenesPermitidos(env).includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ORIGENES_BASE[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function excedeLimite(ip) {
  const ahora = Date.now();
  const lista = (visitas.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora);
  visitas.set(ip, lista);
  return lista.length > LIMITE_POR_MINUTO;
}

async function llamarGemini(env, prompt, { json: pedirJson = true, maxTokens = 4096 } = {}) {
  const modelo = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
  const cuerpo = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxTokens,
      ...(pedirJson ? { responseMimeType: "application/json" } : {}),
    },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify(cuerpo),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || `Gemini respondió ${r.status}`;
    throw Object.assign(new Error(msg), { status: r.status });
  }
  const texto = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  if (!texto) throw Object.assign(new Error("Gemini no devolvió texto"), { status: 502 });
  const u = data.usageMetadata || {};
  return {
    texto,
    modelo,
    uso: { entrada: u.promptTokenCount || 0, salida: u.candidatesTokenCount || 0 },
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const h = cors(origin, env);
    const { pathname, searchParams } = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

    if (!env.GEMINI_API_KEY) {
      return json({ ok: false, error: "Falta el secreto GEMINI_API_KEY en el Worker" }, 500, h);
    }

    if (pathname === "/salud" && request.method === "GET") {
      const modelo = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
      if (searchParams.get("probar") === "1") {
        try {
          const r = await llamarGemini(env, 'Responde solo {"ok":true}', { maxTokens: 20 });
          return json({ ok: true, modelo, gemini: "responde", respuesta: r.texto }, 200, h);
        } catch (e) {
          return json({ ok: false, modelo, gemini: "error", error: e.message }, 502, h);
        }
      }
      return json({ ok: true, modelo, servicio: "AI model audit · servicio IA" }, 200, h);
    }

    if ((pathname === "/reglas" || pathname === "/redactar") && request.method === "POST") {
      if (origin && !origenesPermitidos(env).includes(origin)) {
        return json({ ok: false, error: "Origen no permitido" }, 403, h);
      }
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      if (excedeLimite(ip)) {
        return json({ ok: false, error: "Límite de 10 solicitudes por minuto. Espere un momento." }, 429, h);
      }
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: "JSON inválido" }, 400, h); }
      const prompt = typeof body?.prompt === "string" ? body.prompt : "";
      if (!prompt) return json({ ok: false, error: "Falta el campo prompt" }, 400, h);
      if (prompt.length > MAX_PROMPT) {
        return json({ ok: false, error: `El texto supera ${MAX_PROMPT} caracteres` }, 413, h);
      }
      try {
        const r = await llamarGemini(env, prompt, {
          json: pathname === "/reglas",
          maxTokens: pathname === "/reglas" ? 8192 : 4096,
        });
        return json({ ok: true, ...r }, 200, h);
      } catch (e) {
        return json({ ok: false, error: e.message }, e.status === 429 ? 429 : 502, h);
      }
    }

    return json({ ok: false, error: "Ruta no encontrada. Use /salud, /reglas o /redactar." }, 404, h);
  },
};
