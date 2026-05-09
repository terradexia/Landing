export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const { name, email, company, profile, zone } = body;

  if (!name || !email || !company || !profile) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tblI3tfr8x5E23L4y`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer pat4Z68OeQheeZdAs.9c559aaa89ced823168aa8617549925c4edf19f5a0baa29870f6a5d766e787dd`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Nombre': name.slice(0, 100),
          'Email': email.slice(0, 254),
          'Empresa': company.slice(0, 100),
          'Perfil': profile,
          'Zona': zone || 'nd',
          'Fecha': new Date().toISOString().split('T')[0],
          'Fuente': 'Landing',
        },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('Airtable error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Storage error', detail: data });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}
