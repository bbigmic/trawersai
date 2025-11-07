import bcrypt from 'bcryptjs';

// Hash hasła - wygeneruj nowy hash używając: bcrypt.hashSync('twoje_haslo', 10)
// I ustaw go w zmiennej środowiskowej ADMIN_PASSWORD_HASH
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Hasło jest wymagane' });
    }

    if (!ADMIN_PASSWORD_HASH) {
      console.error('ADMIN_PASSWORD_HASH nie jest ustawione');
      return res.status(500).json({ error: 'Błąd konfiguracji serwera' });
    }

    const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

    if (isValid) {
      // Tworzymy prosty token (w produkcji użyj JWT)
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
      
      // Ustawiamy cookie (w produkcji użyj httpOnly, secure, sameSite)
      res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; Max-Age=86400; SameSite=Lax`);
      
      return res.status(200).json({ success: true, token });
    } else {
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }
  } catch (error) {
    console.error('Błąd autoryzacji:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}
