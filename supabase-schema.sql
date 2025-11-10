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

-- Dodaj kolumnę status (jeśli nie istnieje)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='registrations' AND column_name='status'
    ) THEN
        EXECUTE 'ALTER TABLE registrations ADD COLUMN status TEXT NOT NULL DEFAULT ''w trakcie''';
        EXECUTE 'COMMENT ON COLUMN registrations.status IS ''Status zgłoszenia: w trakcie/zakwalifikowany/niezakwalifikowany''';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status)';
    END IF;
END $$;

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

