// TERRADEX IA — Endpoint de captura de leads
// Valida del lado del servidor, reenvía a Airtable y nunca expone
// la respuesta interna de Airtable al navegador.

const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwam.com', 'fakeinbox.com', 'yopmail.com', 'trashmail.com',
  'sharklasers.com', 'spam4.me', 'dispostable.com',
]);

const VALID_PROFILES = new Set(['fondo', 'productor', 'minera', 'consultor', 'gobierno', 'otro']);
const VALID_ZONES = new Set(['meseta', 'valle', 'golfo', 'sur', 'toda', 'nd']);
const EMAIL_RX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Rate limit simple por IP (mejor esfuerzo: vive por instancia caliente de la función)
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return arr.length > MAX_HITS;
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  const body = req.body || {};

  // Honeypot: los bots que llenan "website" reciben un OK falso y no se guarda nada
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const company = clean(body.company, 100);
  const profile = clean(body.profile, 30);
  const zone = clean(body.zone, 30) || 'nd';

  if (name.length < 2 || company.length < 2 || !EMAIL_RX.test(email) || !VALID_PROFILES.has(profile)) {
    return res.status(400).json({ ok: false, error: 'Invalid input' });
  }
  if (BLOCKED_DOMAINS.has(email.split('@')[1])) {
    return res.status(400).json({ ok: false, error: 'Invalid email domain' });
  }

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tblI3tfr8x5E23L4y`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Nombre': name,
          'Email': email,
          'Empresa': company,
          'Perfil': profile,
          'Zona': VALID_ZONES.has(zone) ? zone : 'nd',
          'Fecha': new Date().toISOString().split('T')[0],
          'Fuente': 'Landing',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Log interno (visible solo en Vercel), nunca al navegador
      console.error('[lead] Airtable error', response.status);
      return res.status(502).json({ ok: false, error: 'Upstream error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] Request failed', err && err.name);
    return res.status(502).json({ ok: false, error: 'Upstream error' });
  }
}
