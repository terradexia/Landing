export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }
  if (!body) body = {};

  const { name, email, company, profile, zone } = body;

  if (!name || !email || !company || !profile) {
    return res.status(400).json({ error: 'Missing fields', received: body });
  }

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tblI3tfr8x5E23L4y`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Nombre del Lead': name,
        'Email': email,
        'Empresa': company,
        'Perfil': profile,
        'Zona': zone || 'nd',
        'Fecha': new Date().toISOString().split('T')[0],
        'Fuente': 'Landing',
      },
    }),
  });

  const data = await response.json();
  return res.status(200).json({ ok: response.ok, airtable: data });
}
