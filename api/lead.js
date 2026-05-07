export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, email, empresa, perfil, zona } = req.body;

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Table%201`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Nombre del Lead': nombre,
          'Email': email,
          'Empresa': empresa,
          'Perfil': perfil,
          'Zona': zona,
          'Fecha': new Date().toISOString().split('T')[0],
          'Fuente': 'Landing',
        },
      }),
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}
