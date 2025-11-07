import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Prosta weryfikacja tokenu (w produkcji użyj JWT)
function verifyToken(req) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/admin_token=([^;]+)/);
  
  if (!tokenMatch) {
    // Sprawdź też header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    return true;
  }
  
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Weryfikacja autoryzacji
  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd pobierania danych:', error);
      return res.status(500).json({ error: 'Błąd pobierania danych' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Błąd serwera:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}
