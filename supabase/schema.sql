-- Next Level Beauty Bar — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS services (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  branch          TEXT NOT NULL DEFAULT 'Kemang',
  service_id      TEXT,
  service_name    TEXT NOT NULL,
  price           NUMERIC NOT NULL,
  date            DATE NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  promo_id        TEXT,
  promo_discount  NUMERIC NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promos (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  discount    NUMERIC NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_all" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "transactions_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "promos_all" ON promos FOR ALL USING (true) WITH CHECK (true);
