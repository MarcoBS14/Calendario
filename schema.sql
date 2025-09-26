-- Tabla simple para reservas
CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('tenis','padel')),
  court TEXT NOT NULL,                   -- ej: "1","2","3"
  date DATE NOT NULL,                    -- YYYY-MM-DD
  start_time TIME NOT NULL,              -- HH:MM
  end_time   TIME NOT NULL,              -- HH:MM
  created_at TIMESTAMP DEFAULT now()
);

-- Aceleradores
CREATE INDEX IF NOT EXISTS idx_reservas_lookup
  ON reservas (sport, court, date, start_time, end_time);

-- Evitar solapes exactos (ayuda, pero validamos en backend la superposición)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_slot
  ON reservas (sport, court, date, start_time);