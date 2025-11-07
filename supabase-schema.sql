-- SQL schema dla Supabase
-- Wykonaj to w Supabase SQL Editor

-- Utwórz tabelę dla zapisów
CREATE TABLE IF NOT EXISTS registrations (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utwórz indeks dla szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- Dodaj komentarz do tabeli
COMMENT ON TABLE registrations IS 'Tabela przechowująca zapisy na szkolenie';

-- Opcjonalnie: Utwórz RLS (Row Level Security) jeśli chcesz zabezpieczyć dane
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca na wstawianie danych (bez logowania)
-- CREATE POLICY "Allow public insert" ON registrations
--   FOR INSERT TO anon
--   WITH CHECK (true);

-- Polityka pozwalająca na odczyt tylko dla zalogowanych użytkowników (w tym przypadku używamy API key)
-- CREATE POLICY "Allow authenticated read" ON registrations
--   FOR SELECT TO authenticated
--   USING (true);

