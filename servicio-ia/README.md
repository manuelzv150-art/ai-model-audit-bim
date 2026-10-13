# Servicio IA · Cloudflare Worker

Intermediario entre la demo publicada en GitHub Pages y Gemini. La clave de Gemini se guarda como secreto del Worker y nunca llega al navegador.

- URL: https://ai-model-audit-ia.manuelzv150.workers.dev
- Rutas: `GET /salud` (estado), `GET /salud?probar=1` (prueba la clave), `POST /reglas` y `POST /redactar` con `{ "prompt": "..." }`
- Controles: solo acepta pedidos del dominio de la demo, máximo 10 solicitudes por minuto por IP y textos de hasta 60 000 caracteres.
- Variables: `GEMINI_API_KEY` (secreto, obligatoria) y `GEMINI_MODEL` (opcional, por defecto `gemini-3.5-flash-lite`).

La demo se conecta mediante `docs/ia-servicio.js`. Si el servicio no responde, la página vuelve al asistente local por palabras clave y lo avisa en pantalla.
