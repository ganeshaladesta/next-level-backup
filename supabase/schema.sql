-- ============================================================
-- NEXT LEVEL BEAUTY BAR
-- SUPABASE DATABASE SCHEMA
-- ONLINE VERSION
-- ============================================================


-- ============================================================
-- 1. SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    price       NUMERIC NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. PROMOS
-- ============================================================

CREATE TABLE IF NOT EXISTS promos (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    discount    NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id               TEXT PRIMARY KEY,

    branch           TEXT NOT NULL DEFAULT 'Kemang',

    service_id       TEXT,

    service_name     TEXT NOT NULL,

    -- Harga treatment asli
    price            NUMERIC NOT NULL DEFAULT 0,

    -- Jam treatment
    treatment_time   TIME,

    -- DP yang sudah dibayar
    dp               NUMERIC NOT NULL DEFAULT 0,

    -- Tanggal treatment
    date             DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Catatan
    notes            TEXT NOT NULL DEFAULT '',

    -- Promo
    promo_id         TEXT,

    -- Persentase promo
    promo_discount   NUMERIC NOT NULL DEFAULT 0,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. MIGRATION
-- Untuk database yang sebelumnya sudah dibuat
-- ============================================================

ALTER TABLE services
ADD COLUMN IF NOT EXISTS id TEXT;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


ALTER TABLE promos
ADD COLUMN IF NOT EXISTS id TEXT;

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

ALTER TABLE promos
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Kemang';

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS service_id TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS service_name TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS treatment_time TIME;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS dp NUMERIC DEFAULT 0;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS promo_id TEXT;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS promo_discount NUMERIC DEFAULT 0;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ============================================================
-- 5. DEFAULT VALUES
-- ============================================================

ALTER TABLE services
ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE services
ALTER COLUMN active SET DEFAULT true;

ALTER TABLE services
ALTER COLUMN created_at SET DEFAULT now();


ALTER TABLE promos
ALTER COLUMN discount SET DEFAULT 0;

ALTER TABLE promos
ALTER COLUMN description SET DEFAULT '';

ALTER TABLE promos
ALTER COLUMN created_at SET DEFAULT now();


ALTER TABLE transactions
ALTER COLUMN branch SET DEFAULT 'Kemang';

ALTER TABLE transactions
ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE transactions
ALTER COLUMN dp SET DEFAULT 0;

ALTER TABLE transactions
ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE transactions
ALTER COLUMN notes SET DEFAULT '';

ALTER TABLE transactions
ALTER COLUMN promo_discount SET DEFAULT 0;

ALTER TABLE transactions
ALTER COLUMN created_at SET DEFAULT now();


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 7. DROP OLD POLICIES
-- ============================================================

DROP POLICY IF EXISTS "services_all" ON services;
DROP POLICY IF EXISTS "transactions_all" ON transactions;
DROP POLICY IF EXISTS "promos_all" ON promos;

DROP POLICY IF EXISTS "services_public_all" ON services;
DROP POLICY IF EXISTS "transactions_public_all" ON transactions;
DROP POLICY IF EXISTS "promos_public_all" ON promos;


-- ============================================================
-- 8. PUBLIC POLICIES
--
-- Untuk aplikasi lu yang sekarang belum pakai login.
-- Supabase anon key hanya bisa akses sesuai policy ini.
-- ============================================================

CREATE POLICY "services_all"
ON services
FOR ALL
TO anon
USING (true)
WITH CHECK (true);


CREATE POLICY "transactions_all"
ON transactions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);


CREATE POLICY "promos_all"
ON promos
FOR ALL
TO anon
USING (true)
WITH CHECK (true);


-- ============================================================
-- 9. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(date);

CREATE INDEX IF NOT EXISTS idx_transactions_branch
ON transactions(branch);

CREATE INDEX IF NOT EXISTS idx_transactions_service_id
ON transactions(service_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_treatment_time
ON transactions(treatment_time);

CREATE INDEX IF NOT EXISTS idx_promos_start_date
ON promos(start_date);

CREATE INDEX IF NOT EXISTS idx_promos_end_date
ON promos(end_date);


-- ============================================================
-- 10. CHECK CONSTRAINTS
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_price_nonnegative'
    ) THEN

        ALTER TABLE transactions
        ADD CONSTRAINT transactions_price_nonnegative
        CHECK (price >= 0);

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_dp_nonnegative'
    ) THEN

        ALTER TABLE transactions
        ADD CONSTRAINT transactions_dp_nonnegative
        CHECK (dp >= 0);

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_promo_discount_valid'
    ) THEN

        ALTER TABLE transactions
        ADD CONSTRAINT transactions_promo_discount_valid
        CHECK (
            promo_discount >= 0
            AND promo_discount <= 100
        );

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'promos_discount_valid'
    ) THEN

        ALTER TABLE promos
        ADD CONSTRAINT promos_discount_valid
        CHECK (
            discount >= 0
            AND discount <= 100
        );

    END IF;

END $$;


-- ============================================================
-- 11. VERIFY TRANSACTIONS
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;


-- ============================================================
-- 12. VERIFY SERVICES
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;


-- ============================================================
-- 13. VERIFY PROMOS
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'promos'
ORDER BY ordinal_position;