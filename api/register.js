import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Inicjalizacja Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Konfiguracja SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Vercel Serverless Function
export default async function handler(req, res) {
  // Obsługa CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, email, phone } = req.body;

    // Walidacja
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    // Walidacja emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Nieprawidłowy format emaila' });
    }

    // Zapis do bazy danych Supabase
    const { data, error: dbError } = await supabase
      .from('registrations')
      .insert([
        {
          full_name: fullName,
          email: email,
          phone: phone,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (dbError) {
      console.error('Błąd zapisu do bazy:', dbError);
      return res.status(500).json({ error: 'Błąd zapisu danych' });
    }

    // Wysyłka emaila do administratora
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const mailOptions = {
      from: `"Formularz Zapisów" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: 'Nowy zapis na szkolenie',
      html: `
        <h2>Nowy zapis na szkolenie</h2>
        <p><strong>Imię i nazwisko:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Data zapisu:</strong> ${new Date().toLocaleString('pl-PL')}</p>
      `,
      text: `
        Nowy zapis na szkolenie
        
        Imię i nazwisko: ${fullName}
        Email: ${email}
        Telefon: ${phone}
        Data zapisu: ${new Date().toLocaleString('pl-PL')}
      `,
    };

    // Wysyłka emaila do użytkownika (potwierdzenie)
    const userMailOptions = {
      from: `"TRAWERS-ADR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Potwierdzenie zapisu na szkolenie',
      html: `
        <h2>Dziękujemy za zapis!</h2>
        <p>Witaj ${fullName},</p>
        <p>Twoje zgłoszenie na szkolenie zostało przyjęte. Wkrótce skontaktujemy się z Tobą.</p>
        <hr>
        <p><small>TRAWERS-ADR</small></p>
      `,
      text: `
        Dziękujemy za zapis!
        
        Witaj ${fullName},
        
        Twoje zgłoszenie na szkolenie zostało przyjęte. Wkrótce skontaktujemy się z Tobą.
        
        TRAWERS-ADR
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      await transporter.sendMail(userMailOptions);
    } catch (emailError) {
      console.error('Błąd wysyłki emaila:', emailError);
      // Kontynuujemy mimo błędu emaila, bo zapis do bazy się powiódł
    }

    return res.status(200).json({
      success: true,
      message: 'Zapis został zarejestrowany',
      id: data[0].id,
    });
  } catch (error) {
    console.error('Błąd serwera:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}
