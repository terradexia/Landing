export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, profile, zone } = req.body || {};

  if (!name || !email || !company || !profile) {
    return res.status(400).json({ error: 'Missing fields' });
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
