# 🚀 Szybki Start - Jak Uruchomić Projekt

## Opcja 1: Uruchomienie Lokalne (Testowanie)

### Krok 1: Zainstaluj zależności

```bash
cd /Users/bigmic/Desktop/apki/zapisy
npm install
```

### Krok 2: Zainstaluj Vercel CLI (jeśli nie masz)

```bash
npm install -g vercel
```

### Krok 3: Utwórz plik `.env.local` z zmiennymi środowiskowymi

Utwórz plik `.env.local` w głównym folderze projektu:

```env
# Supabase
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-klucz-api

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=twoj-email@gmail.com
SMTP_PASS=twoje-app-password
ADMIN_EMAIL=twoj-email@gmail.com

# Admin Panel
ADMIN_PASSWORD_HASH=$2a$10$wygenerowany-hash-hasla
```

### Krok 4: Uruchom lokalnie

```bash
vercel dev
```

Projekt będzie dostępny na `http://localhost:3000`

---

## Opcja 2: Deployment na Vercel (Produkcja) ⭐ REKOMENDOWANE

### Krok 1: Przygotuj Supabase

1. Idź na [supabase.com](https://supabase.com) i załóż darmowe konto
2. Utwórz nowy projekt
3. Przejdź do **SQL Editor**
4. Skopiuj zawartość pliku `supabase-schema.sql` i wykonaj w SQL Editor
5. Skopiuj:
   - **Project URL** (Settings → API → Project URL)
   - **Anon public key** (Settings → API → anon public)

### Krok 2: Przygotuj SMTP

#### Dla Gmail:
1. Włącz **2-Step Verification** w [Google Account](https://myaccount.google.com/security)
2. Wygeneruj **App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Wybierz "Mail" i "Other (Custom name)"
   - Skopiuj wygenerowane hasło (16 znaków)

#### Dla innych serwerów:
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Outlook**: `smtp-mail.outlook.com:587`

### Krok 3: Wygeneruj Hash Hasła Admina

W terminalu:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('twoje_haslo_admina', 10));"
```

Skopiuj wygenerowany hash.

### Krok 4: Wdróż na Vercel

#### Metoda A: Przez GitHub (Najłatwiejsza)

1. Utwórz repozytorium na GitHub
2. Wrzuć kod do repozytorium:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/twoja-nazwa/twoje-repo.git
   git push -u origin main
   ```

3. Idź na [vercel.com](https://vercel.com) i zaloguj się
4. Kliknij **"Add New Project"**
5. Wybierz swoje repozytorium GitHub
6. **Ustaw zmienne środowiskowe** (Settings → Environment Variables):
   ```
   SUPABASE_URL = https://twoj-projekt.supabase.co
   SUPABASE_KEY = twoj-klucz-api
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = twoj-email@gmail.com
   SMTP_PASS = twoje-app-password
   ADMIN_EMAIL = twoj-email@gmail.com
   ADMIN_PASSWORD_HASH = $2a$10$wygenerowany-hash
   ```
7. Kliknij **"Deploy"**

#### Metoda B: Przez Vercel CLI

```bash
# Zaloguj się
vercel login

# Wdróż
vercel --prod
```

Podczas deployu Vercel zapyta o zmienne środowiskowe - wprowadź je wszystkie.

### Krok 5: Dostęp do Panelu Admin

Po deploymencie:
- Strona główna: `https://twoj-projekt.vercel.app`
- Panel admin: `https://twoj-projekt.vercel.app/admin.html`

---

## 🔧 Rozwiązywanie Problemów

### "Cannot find module"
```bash
npm install
```

### "vercel: command not found"
```bash
npm install -g vercel
```

### Błąd SMTP
- Sprawdź czy wszystkie zmienne SMTP są ustawione
- Dla Gmail: upewnij się, że używasz **App Password**, nie zwykłego hasła
- Sprawdź czy port jest poprawny (587 dla TLS, 465 dla SSL)

### Błąd Supabase
- Sprawdź czy tabela `registrations` została utworzona
- Sprawdź czy `SUPABASE_URL` i `SUPABASE_KEY` są poprawne
- W Supabase: Settings → API → sprawdź czy klucze są poprawne

### Błąd autoryzacji admina
- Upewnij się, że `ADMIN_PASSWORD_HASH` jest poprawnie ustawiony
- Hash musi zaczynać się od `$2a$10$` lub podobnie

---

## 📝 Szybka Checklista

- [ ] Zainstalowano `npm install`
- [ ] Utworzono projekt Supabase
- [ ] Wykonano `supabase-schema.sql`
- [ ] Skonfigurowano SMTP (Gmail App Password lub inny)
- [ ] Wygenerowano `ADMIN_PASSWORD_HASH`
- [ ] Ustawiono wszystkie zmienne środowiskowe w Vercel
- [ ] Wdrożono projekt na Vercel
- [ ] Przetestowano formularz na stronie głównej
- [ ] Przetestowano panel admin (`/admin.html`)

---

## 🎯 Co dalej?

Po udanym deploymencie:
1. Przetestuj formularz zapisów
2. Sprawdź czy email-e przychodzą
3. Zaloguj się do panelu admin i sprawdź zapisy
4. Gotowe! 🎉

