import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, phone, fiszka_number, category } = req.body || {};

    if (!id && !phone) {
      return res.status(400).json({ error: 'Wymagane jest id lub phone' });
    }

    const updateData = {
      status: 'etap pierwszy ukończony',
      updated_at: new Date().toISOString()
    };

    if (fiszka_number) {
      updateData.fiszka_number = fiszka_number;
    }

    if (category) {
      updateData.category = category;
    }

    let query = supabase
      .from('registrations')
      .update(updateData)
      .select()
      .single();

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('phone', phone);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Błąd aktualizacji etapu:', error);
      return res.status(500).json({ error: 'Błąd aktualizacji etapu' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Błąd serwera:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}


