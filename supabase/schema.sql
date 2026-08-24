-- ============================================================
-- Next Level Beauty Bar — Supabase Database Schema
-- ============================================================
-- Run this in:
-- Supabase Dashboard → SQL Editor
--
-- Logic transaksi:
--
-- Total Treatment
--       ↓
--      - DP
--       ↓
-- Sisa Sebelum Promo
--       ↓
--   - Diskon Promo
--       ↓
-- Sisa Setelah Promo
--
-- DP TIDAK ikut terkena diskon.
-- ============================================================


-- ============================================================
-- 1. SERVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    price       NUMERIC NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. PROMOS
-- ============================================================

CREATE TABLE IF NOT EXISTS promos (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    discount     NUMERIC NOT NULL DEFAULT 0,
    description  TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id                  TEXT PRIMARY KEY,

    -- Cabang
    branch              TEXT NOT NULL DEFAULT 'Kemang',

    -- Service
    service_id          TEXT,
    service_name        TEXT NOT NULL,

    -- ========================================================
    -- TREATMENT
    -- ========================================================

    -- Harga treatment sebelum DP dan promo
    total_treatment     NUMERIC NOT NULL DEFAULT 0,

    -- ========================================================
    -- WAKTU TREATMENT
    -- ========================================================

    -- Tanggal treatment
    date                DATE NOT NULL,

    -- Jam mulai treatment
    treatment_time      TIME,

    -- ========================================================
    -- DP
    -- ========================================================

    -- DP yang sudah dibayar customer
    dp                  NUMERIC NOT NULL DEFAULT 0,

    -- Sisa setelah DP
    --
    -- total_treatment - dp
    --
    remaining_before_promo NUMERIC NOT NULL DEFAULT 0,

    -- ========================================================
    -- PROMO
    -- ========================================================

    promo_id            TEXT,

    -- Persentase diskon
    promo_discount      NUMERIC NOT NULL DEFAULT 0,

    -- Nominal diskon
    --
    -- remaining_before_promo * promo_discount / 100
    discount_amount     NUMERIC NOT NULL DEFAULT 0,

    -- ========================================================
    -- FINAL PAYMENT
    -- ========================================================

    -- Sisa yang harus dibayar setelah promo
    --
    -- remaining_before_promo - discount_amount
    final_payment       NUMERIC NOT NULL DEFAULT 0,

    -- ========================================================
    -- CATATAN
    -- ========================================================

    notes               TEXT NOT NULL DEFAULT '',

    -- Timestamp database
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE promos ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. POLICIES
-- ============================================================
-- Untuk development / aplikasi internal.
--
-- Semua operasi diperbolehkan.
-- Nanti kalau authentication sudah dibuat,
-- policy ini sebaiknya diperketat.
-- ============================================================

DROP POLICY IF EXISTS "services_all" ON services;

CREATE POLICY "services_all"
ON services
FOR ALL
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "transactions_all" ON transactions;

CREATE POLICY "transactions_all"
ON transactions
FOR ALL
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "promos_all" ON promos;

CREATE POLICY "promos_all"
ON promos
FOR ALL
USING (true)
WITH CHECK (true);


-- ============================================================
-- 6. OPTIONAL INDEXES
-- ============================================================
-- Membantu pencarian transaksi berdasarkan tanggal,
-- cabang, dan service.

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(date);

CREATE INDEX IF NOT EXISTS idx_transactions_branch
ON transactions(branch);

CREATE INDEX IF NOT EXISTS idx_transactions_service
ON transactions(service_id);

CREATE INDEX IF NOT EXISTS idx_transactions_treatment_time
ON transactions(treatment_time);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
ON transactions(created_at);


-- ============================================================
-- 7. OPTIONAL CHECK CONSTRAINTS
-- ============================================================
-- Mencegah angka negatif.

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_total_treatment_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_total_treatment_check
CHECK (total_treatment >= 0);


ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_dp_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_dp_check
CHECK (dp >= 0);


ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_promo_discount_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_promo_discount_check
CHECK (promo_discount >= 0 AND promo_discount <= 100);


ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_discount_amount_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_discount_amount_check
CHECK (discount_amount >= 0);


ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_final_payment_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_final_payment_check
CHECK (final_payment >= 0);