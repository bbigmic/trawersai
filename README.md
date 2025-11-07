# Backend dla Formularza Zapisów - Vercel + Supabase

Kompletny backend dla formularza zapisów na szkolenie z obsługą SMTP i panelem administracyjnym.

## 🚀 Funkcjonalności

- ✅ Wysyłanie danych formularza przez SMTP
- ✅ Zapis danych do bazy Supabase (PostgreSQL)
- ✅ Panel administracyjny zabezpieczony hasłem
- ✅ Automatyczne email-e powitalne dla użytkowników
- ✅ Powiadomienia email dla administratora

## 📋 Wymagania

- Konto na [Vercel](https://vercel.com) (darmowe)
- Konto na [Supabase](https://supabase.com) (darmowe)
- Dostęp do serwera SMTP (np. Gmail, SendGrid, Mailgun)

## 🛠️ Instalacja i Konfiguracja

### 1. Przygotowanie bazy danych Supabase

1. Załóż konto na [Supabase](https://supabase.com)
2. Utwórz nowy projekt
3. Przejdź do **SQL Editor** w panelu Supabase
4. Wykonaj skrypt z pliku `supabase-schema.sql`
5. Skopiuj:
   - **Project URL** → będzie to `SUPABASE_URL`
   - **API Key** (anon public) → będzie to `SUPABASE_KEY`

### 2. Konfiguracja zmiennych środowiskowych

W projekcie Vercel dodaj następujące zmienne środowiskowe:

#### Supabase
- `SUPABASE_URL` - URL twojego projektu Supabase
- `SUPABASE_KEY` - Anon public key z Supabase

#### SMTP
- `SMTP_HOST` - Host serwera SMTP (np. `smtp.gmail.com`)
- `SMTP_PORT` - Port SMTP (np. `587` lub `465`)
- `SMTP_SECURE` - `true` dla SSL (port 465) lub `false` dla TLS (port 587)
- `SMTP_USER` - Twój email SMTP
- `SMTP_PASS` - Hasło/App Password do SMTP
- `ADMIN_EMAIL` - Email, na który będą przychodzić powiadomienia o nowych zapisach

#### Admin Panel
- `ADMIN_PASSWORD_HASH` - Hash hasła administratora

#### Generowanie hasła administratora

Uruchom w Node.js:
```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('twoje_haslo', 10));
```

Lub w terminalu (po zainstalowaniu zależności):
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('twoje_haslo', 10));"
```

Wklej wygenerowany hash jako wartość `ADMIN_PASSWORD_HASH`.

### 3. Konfiguracja SMTP

#### Gmail (przykład)

1. Włącz **2-Step Verification** w ustawieniach Google
2. Wygeneruj **App Password**:
   - Przejdź do [Google Account Security](https://myaccount.google.com/security)
   - Włącz "2-Step Verification" jeśli nie masz
   - Wybierz "App passwords"
   - Wybierz "Mail" i "Other (Custom name)"
   - Skopiuj wygenerowane hasło

3. Ustaw zmienne:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=twoj-email@gmail.com`
   - `SMTP_PASS=wygenerowane-app-password`

#### Inne serwery SMTP

- **SendGrid**: `smtp.sendgrid.net`, port `587`
- **Mailgun**: `smtp.mailgun.org`, port `587`
- **Outlook**: `smtp-mail.outlook.com`, port `587`

## 📦 Deployment na Vercel

### Metoda 1: Vercel CLI

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Zaloguj się
vercel login

# Wdróż projekt
vercel --prod
```

### Metoda 2: GitHub Integration (Rekomendowane)

1. Wrzuć kod do repozytorium GitHub
2. Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
3. Kliknij **"Add New Project"**
4. Wybierz swoje repozytorium
5. Ustaw zmienne środowiskowe w ustawieniach projektu
6. Kliknij **"Deploy"**

### Metoda 3: Vercel Dashboard

1. Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Kliknij **"Add New Project"**
3. Wybierz **"Import Git Repository"** lub **"Import Project"**
4. Wgraj folder projektu
5. Skonfiguruj zmienne środowiskowe
6. Wdróż projekt

## 📁 Struktura Projektu

```
zapisy/
├── api/
│   ├── register.js              # Endpoint zapisów
│   └── admin/
│       ├── auth.js              # Autoryzacja admina
│       └── registrations.js     # Pobieranie zapisów
├── admin.html                   # Panel administracyjny
├── index.html                   # Strona główna z formularzem
├── styles.css                   # Style CSS
├── package.json                 # Zależności Node.js
├── vercel.json                  # Konfiguracja Vercel
├── supabase-schema.sql          # Schema bazy danych
└── README.md                    # Ten plik
```

## 🔐 Dostęp do Panelu Admin

1. Otwórz `/admin.html` w przeglądarce
2. Wprowadź hasło administratora
3. Po zalogowaniu zobaczysz listę wszystkich zapisów

## 🧪 Testowanie Lokalne

```bash
# Zainstaluj zależności
npm install

# Uruchom lokalnie (wymaga Vercel CLI)
vercel dev
```

## 📧 Format Email-i

### Email dla administratora
Otrzymasz email z danymi nowego zapisu:
- Imię i nazwisko
- Email
- Telefon
- Data zapisu

### Email dla użytkownika
Każdy zapisany użytkownik otrzyma email potwierdzający:
- Powitanie
- Informacja o przyjęciu zgłoszenia
- Obietnica kontaktu

## 🐛 Rozwiązywanie Problemów

### Błąd "Cannot find module"
Upewnij się, że wszystkie zależności są zainstalowane:
```bash
npm install
```

### Błąd SMTP
- Sprawdź czy wszystkie zmienne SMTP są ustawione
- Dla Gmail: upewnij się, że używasz App Password, nie zwykłego hasła
- Sprawdź czy port i secure są poprawne

### Błąd Supabase
- Sprawdź czy `SUPABASE_URL` i `SUPABASE_KEY` są poprawne
- Upewnij się, że tabela `registrations` została utworzona
- Sprawdź czy RLS (Row Level Security) nie blokuje zapytań

### Błąd autoryzacji admina
- Sprawdź czy `ADMIN_PASSWORD_HASH` jest poprawnie ustawiony
- Upewnij się, że używasz hash, nie zwykłego hasła

## 📝 API Endpoints

### POST `/api/register`
Wysyła dane formularza zapisów.

**Request:**
```json
{
  "fullName": "Jan Kowalski",
  "email": "jan@example.com",
  "phone": "+48 123 456 789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Zapis został zarejestrowany",
  "id": 1
}
```

### POST `/api/admin/auth`
Logowanie administratora.

**Request:**
```json
{
  "password": "twoje_haslo"
}
```

### GET `/api/admin/registrations`
Pobiera listę wszystkich zapisów (wymaga autoryzacji).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "Jan Kowalski",
      "email": "jan@example.com",
      "phone": "+48 123 456 789",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## 🔒 Bezpieczeństwo

- Hasła są hashowane przy użyciu bcrypt
- API endpoints wymagają odpowiedniej autoryzacji
- CORS jest skonfigurowany dla bezpieczeństwa
- Dane są przechowywane w bezpiecznej bazie Supabase

## 📄 Licencja

Ten projekt jest własnością TRAWERS-ADR.

## 🆘 Wsparcie

W razie problemów sprawdź:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/about/)

