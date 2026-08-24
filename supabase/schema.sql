-- ============================================================
-- NEXT LEVEL BEAUTY BAR
-- SUPABASE DATABASE SCHEMA
-- FINAL
-- ============================================================

-- ============================================================
-- 1. SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    price       NUMERIC NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. PROMOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promos (
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

CREATE TABLE IF NOT EXISTS public.transactions (
    id               TEXT PRIMARY KEY,

    -- Cabang:
    -- Kemang
    -- LCC
    -- Bintaro
    -- Bandung
    branch           TEXT NOT NULL DEFAULT 'Kemang',

    service_id       TEXT,
    service_name     TEXT NOT NULL,

    -- Harga treatment asli
    price            NUMERIC NOT NULL DEFAULT 0,

    -- Jam treatment
    treatment_time   TIME,

    -- DP / uang muka
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
--    Aman dijalankan walaupun tabel sudah pernah dibuat
-- ============================================================

-- SERVICES
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- PROMOS
ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

ALTER TABLE public.promos
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- TRANSACTIONS
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Kemang';

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS service_id TEXT;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS service_name TEXT;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS treatment_time TIME;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS dp NUMERIC DEFAULT 0;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS promo_id TEXT;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS promo_discount NUMERIC DEFAULT 0;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();


-- ============================================================
-- 5. FIX NULL DATA DARI DATABASE LAMA
-- ============================================================

UPDATE public.services
SET price = 0
WHERE price IS NULL;

UPDATE public.services
SET active = true
WHERE active IS NULL;

UPDATE public.services
SET created_at = now()
WHERE created_at IS NULL;


UPDATE public.promos
SET discount = 0
WHERE discount IS NULL;

UPDATE public.promos
SET description = ''
WHERE description IS NULL;

UPDATE public.promos
SET created_at = now()
WHERE created_at IS NULL;


UPDATE public.transactions
SET branch = 'Kemang'
WHERE branch IS NULL OR branch = '';

UPDATE public.transactions
SET price = 0
WHERE price IS NULL;

UPDATE public.transactions
SET dp = 0
WHERE dp IS NULL;

UPDATE public.transactions
SET promo_discount = 0
WHERE promo_discount IS NULL;

UPDATE public.transactions
SET notes = ''
WHERE notes IS NULL;

UPDATE public.transactions
SET date = CURRENT_DATE
WHERE date IS NULL;

UPDATE public.transactions
SET created_at = now()
WHERE created_at IS NULL;


-- ============================================================
-- 6. DEFAULT VALUES
-- ============================================================

ALTER TABLE public.services
    ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE public.services
    ALTER COLUMN active SET DEFAULT true;

ALTER TABLE public.services
    ALTER COLUMN created_at SET DEFAULT now();


ALTER TABLE public.promos
    ALTER COLUMN discount SET DEFAULT 0;

ALTER TABLE public.promos
    ALTER COLUMN description SET DEFAULT '';

ALTER TABLE public.promos
    ALTER COLUMN created_at SET DEFAULT now();


ALTER TABLE public.transactions
    ALTER COLUMN branch SET DEFAULT 'Kemang';

ALTER TABLE public.transactions
    ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE public.transactions
    ALTER COLUMN dp SET DEFAULT 0;

ALTER TABLE public.transactions
    ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE public.transactions
    ALTER COLUMN notes SET DEFAULT '';

ALTER TABLE public.transactions
    ALTER COLUMN promo_discount SET DEFAULT 0;

ALTER TABLE public.transactions
    ALTER COLUMN created_at SET DEFAULT now();


-- ============================================================
-- 7. NOT NULL
-- ============================================================

ALTER TABLE public.services
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.services
    ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.services
    ALTER COLUMN active SET NOT NULL;

ALTER TABLE public.services
    ALTER COLUMN created_at SET NOT NULL;


ALTER TABLE public.promos
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.promos
    ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.promos
    ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.promos
    ALTER COLUMN discount SET NOT NULL;

ALTER TABLE public.promos
    ALTER COLUMN description SET NOT NULL;

ALTER TABLE public.promos
    ALTER COLUMN created_at SET NOT NULL;


ALTER TABLE public.transactions
    ALTER COLUMN branch SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN service_name SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN price SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN dp SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN date SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN notes SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN promo_discount SET NOT NULL;

ALTER TABLE public.transactions
    ALTER COLUMN created_at SET NOT NULL;


-- ============================================================
-- 8. CHECK CONSTRAINTS
-- ============================================================

DO $$
BEGIN

    -- SERVICES PRICE
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_price_nonnegative'
    ) THEN

        ALTER TABLE public.services
        ADD CONSTRAINT services_price_nonnegative
        CHECK (price >= 0);

    END IF;


    -- PROMO DISCOUNT
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'promos_discount_valid'
    ) THEN

        ALTER TABLE public.promos
        ADD CONSTRAINT promos_discount_valid
        CHECK (
            discount >= 0
            AND discount <= 100
        );

    END IF;


    -- TRANSACTION PRICE
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_price_nonnegative'
    ) THEN

        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_price_nonnegative
        CHECK (price >= 0);

    END IF;


    -- TRANSACTION DP
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_dp_nonnegative'
    ) THEN

        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_dp_nonnegative
        CHECK (dp >= 0);

    END IF;


    -- TRANSACTION PROMO
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_promo_discount_valid'
    ) THEN

        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_promo_discount_valid
        CHECK (
            promo_discount >= 0
            AND promo_discount <= 100
        );

    END IF;

END $$;


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 10. REMOVE OLD POLICIES
-- ============================================================

DROP POLICY IF EXISTS "services_all" ON public.services;
DROP POLICY IF EXISTS "promos_all" ON public.promos;
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;


-- ============================================================
-- 11. POLICIES
--
-- Untuk aplikasi internal tanpa authentication.
-- Ini memungkinkan anon key melakukan SELECT/INSERT/UPDATE/DELETE.
--
-- Kalau nanti kita bikin login/auth Supabase, bagian ini
-- WAJIB kita perketat.
-- ============================================================

CREATE POLICY "services_all"
ON public.services
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


CREATE POLICY "promos_all"
ON public.promos
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


CREATE POLICY "transactions_all"
ON public.transactions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ============================================================
-- 12. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_services_active
ON public.services(active);

CREATE INDEX IF NOT EXISTS idx_services_name
ON public.services(name);


CREATE INDEX IF NOT EXISTS idx_promos_start_date
ON public.promos(start_date);

CREATE INDEX IF NOT EXISTS idx_promos_end_date
ON public.promos(end_date);


CREATE INDEX IF NOT EXISTS idx_transactions_date
ON public.transactions(date);

CREATE INDEX IF NOT EXISTS idx_transactions_branch
ON public.transactions(branch);

CREATE INDEX IF NOT EXISTS idx_transactions_service_id
ON public.transactions(service_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON public.transactions(created_at);


-- ============================================================
-- 13. VERIFY SERVICES
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'services'
ORDER BY ordinal_position;


-- ============================================================
-- 14. VERIFY PROMOS
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'promos'
ORDER BY ordinal_position;


-- ============================================================
-- 15. VERIFY TRANSACTIONS
-- ============================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;