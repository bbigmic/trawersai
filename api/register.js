import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Inicjalizacja Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Walidacja zmiennych środowiskowych
if (!supabaseUrl || !supabaseKey) {
  console.error('BŁĄD: Brak zmiennych środowiskowych Supabase!');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓ ustawiony' : '✗ brak');
  console.error('SUPABASE_KEY:', supabaseKey ? '✓ ustawiony' : '✗ brak');
}

if (supabaseKey && supabaseKey.startsWith('sbp_')) {
  console.error('UWAGA: Klucz API wygląda na klucz MCP, nie klucz Supabase API!');
  console.error('Potrzebujesz klucza service_role z Supabase Dashboard (Settings → API)');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Konfiguracja SMTP
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpSecure = process.env.SMTP_SECURE === 'true';

// Walidacja konfiguracji SMTP
if (smtpPort === 465 && !smtpSecure) {
  console.warn('UWAGA: Port 465 wymaga SMTP_SECURE=true (SSL)');
}
if (smtpPort === 587 && smtpSecure) {
  console.warn('UWAGA: Port 587 zwykle używa SMTP_SECURE=false (STARTTLS)');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure, // true dla portu 465 (SSL), false dla portu 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 sekund timeout na połączenie
  greetingTimeout: 10000, // 10 sekund timeout na greeting
  socketTimeout: 10000, // 10 sekund timeout na socket
  // Dla portu 587 (STARTTLS) - wymagane opcje
  ...(smtpPort === 587 && !smtpSecure && {
    requireTLS: true,
    tls: {
      rejectUnauthorized: false, // Dla serwerów z samopodpisanymi certyfikatami
    },
  }),
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

    // Jeśli istnieje zapis dla tego telefonu lub emaila → użyj go
    const { data: existing, error: findError } = await supabase
      .from('registrations')
      .select('*')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Błąd sprawdzania istnienia rekordu:', findError);
    }

    if (existing && existing.length > 0) {
      const row = existing[0];
      return res.status(200).json({
        success: true,
        message: 'Istniejący zapis – przekierowanie do strony sukcesu',
        id: row.id,
        status: row.status || null,
        existed: true,
      });
    }

    // Zapis do bazy danych Supabase (nowy rekord)
    const { data, error: dbError } = await supabase
      .from('registrations')
      .insert([
        {
          full_name: fullName,
          email: email,
          phone: phone,
          created_at: new Date().toISOString(),
          status: 'w trakcie',
        },
      ])
      .select();

    if (dbError) {
      console.error('Błąd zapisu do bazy:', dbError);
      return res.status(500).json({ error: 'Błąd zapisu danych' });
    }

    // Sprawdzenie, czy dane zostały zwrócone (może być problem z RLS)
    if (!data || data.length === 0) {
      console.error('Brak danych zwróconych z bazy - możliwy problem z uprawnieniami RLS');
      // Kontynuujemy mimo to, bo zapis mógł się powieść, ale RLS blokuje odczyt
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
    const instructionHtml = `
      <h2 style="margin:0 0 12px 0;">Dziękujemy za zapis!</h2>
      <p>Witaj ${fullName},</p>
      <p>Twoje zgłoszenie zostało przyjęte. Poniżej znajdziesz krótką instrukcję, jak szybko dokończyć proces.</p>
      <p>
        <a href="https://www.rozwojowe.eu/psf9/aplikuj/" target="_blank" style="display:inline-block;padding:10px 14px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
          Wypełnij fiszkę teraz →
        </a>
      </p>
      <ol>
        <li><strong>Wypełnij fiszkę</strong><br>
          <div>Uwzględnij odpowiedzi:</div>
          <ul>
            <li>PKT. 1–8: swoje dane</li>
            <li>PKT. 9: <strong>NIE</strong></li>
            <li>PKT. 10: <strong>NIE</strong></li>
            <li>PKT. 11: <strong>NIE POTRZEBUJĘ...</strong></li>
            <li>PKT. 12: zaznacz <strong>TAK</strong>, jeśli masz wykształcenie średnie lub niższe (i masz świadectwo), posiadasz zaświadczenie o niepełnosprawności, jesteś zarejestrowany bezrobotny lub masz powyżej 55 lat.</li>
            <li>PKT. 14: <strong>TAK</strong></li>
          </ul>
          <div>1.2 Prześlij fiszkę.</div>
        </li>
        <li><strong>Mail z fiszką zwrotną</strong> — do ok. 3 min dostaniesz gotową fiszkę, pobierz ją.</li>
        <li><strong>Podpisz elektronicznie</strong><br>
          3.1 Wejdź: <a href="https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany" target="_blank">Podpisz dokument podpisem zaufanym</a><br>
          3.2 Kliknij <em>Start</em><br>
          3.3 Wybierz opcję „Chcesz podpisać dokument PDF”<br>
          3.4 „Podpisz lub sprawdź dokument PDF”<br>
          3.5 Wybierz fiszkę z dysku<br>
          3.6 Kliknij „Podpisz” i 3.7 podpisz Profilem Zaufanym (lub inną metodą)<br>
          3.8 Pobierz podpisaną fiszkę.
        </li>
        <li><strong>Sprawdź podpis</strong> — pieczątka powinna być w prawym górnym rogu.</li>
        <li><strong>Odeślij dokument</strong> — wyślij na adres podany w wiadomości z fiszką. W treści dopisz: „Proszę o pozytywne rozpatrzenie wniosku”.</li>
      </ol>
      <p style="margin-top:14px">Jeśli potrzebujesz pomocy przy wypełnianiu, zadzwoń: <a href="tel:+48500800800">+48 500 800 800</a></p>
    `;

    const instructionText = `
      Dziękujemy za zapis!
      Witaj ${fullName},
      1) Wypełnij fiszkę: https://www.rozwojowe.eu/psf9/aplikuj/
         PKT.1–8: dane, PKT.9: NIE, PKT.10: NIE, PKT.11: NIE POTRZEBUJĘ...
         PKT.12: TAK (jeśli: wykształcenie ≤ średnie, niepełnosprawność, bezrobotny, >55 lat)
         PKT.14: TAK. Następnie prześlij fiszkę.
      2) W 3 min otrzymasz maila z fiszką zwrotną – pobierz ją.
      3) Podpisz elektronicznie:
         https://www.gov.pl/web/gov/podpisz-dokument-elektronicznie-wykorzystaj-podpis-zaufany
         Start → „Chcesz podpisać dokument PDF” → „Podpisz lub sprawdź dokument PDF”
         Wybierz plik → Podpisz → pobierz podpisaną fiszkę.
      4) Sprawdź pieczątkę w prawym górnym rogu.
      5) Odeślij podpisaną fiszkę na adres z wiadomości, dopisz:
         „Proszę o pozytywne rozpatrzenie wniosku”.
      Pomoc telefoniczna: +48 500 800 800
    `;

    const userMailOptions = {
      from: `"TRAWERS-ADR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Zgłoszenie przyjęte – instrukcja krok po kroku',
      html: instructionHtml,
      text: instructionText,
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
      id: data && data.length > 0 ? data[0].id : null,
      status: 'w trakcie',
    });
  } catch (error) {
    console.error('Błąd serwera:', error);
    return res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
}
