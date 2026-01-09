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

  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Weryfikacja autoryzacji (tylko dla POST/PUT)
  if ((req.method === 'POST' || req.method === 'PUT') && !verifyToken(req)) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  try {
    // GET - pobieranie ustawień (publiczne, bez autoryzacji)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'fiszka_link')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Błąd pobierania ustawień:', error);
        return res.status(500).json({ error: 'Błąd pobierania ustawień' });
      }

      // Jeśli nie ma ustawienia, zwróć domyślny link
      const defaultLink = 'https://www.rozwojowe.eu/psf9/aplikuj/';
      const link = data?.value || defaultLink;

      return res.status(200).json({ success: true, data: { fiszka_link: link } });
    }

    // POST/PUT - zapisywanie ustawień (wymaga autoryzacji)
    if (req.method === 'POST' || req.method === 'PUT') {
      const { fiszka_link } = req.body || {};

      if (!fiszka_link || typeof fiszka_link !== 'string') {
        return res.status(400).json({ error: 'Link fiszki jest wymagany' });
      }

      // Walidacja URL
      try {
        new URL(fiszka_link);
      } catch {
        return res.status(400).json({ error: 'Nieprawidłowy format URL' });
      }

      // Sprawdź czy ustawienie już istnieje
      const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'fiszka_link')
        .single();

      let result;
      if (existing) {
        // Aktualizuj istniejące
        const { data, error } = await supabase
          .from('settings')
          .update({ value: fiszka_link, updated_at: new Date().toISOString() })
          .eq('key', 'fiszka_link')
          .select()
          .single();

        if (error) {
          console.error('Błąd aktualizacji ustawienia:', error);
          return res.status(500).json({ error: 'Błąd aktualizacji ustawienia' });
        }
        result = data;
      } else {
        // Utwórz nowe
        const { data, error } = await supabase
          .from('settings')
          .insert({ key: 'fiszka_link', value: fiszka_link })
          .select()
          .single();

        if (error) {
          console.error('Błąd zapisywania ustawienia:', error);
          return res.status(500).json({ error: 'Błąd zapisywania ustawienia' });
        }
        result = data;
      }

      return res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.error('Błąd serwera:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}


