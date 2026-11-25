CREATE TABLE IF NOT EXISTS bases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN','BASE_COMMANDER','LOGISTICS_OFFICER')),
  base_id INT REFERENCES bases(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('WEAPON','VEHICLE','AMMUNITION','OTHER'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id),
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  notes TEXT DEFAULT '',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  source_base_id INT NOT NULL REFERENCES bases(id),
  destination_base_id INT NOT NULL REFERENCES bases(id),
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING','IN_TRANSIT','COMPLETED')),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (source_base_id <> destination_base_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id),
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  assigned_to VARCHAR(120),
  notes TEXT DEFAULT '',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenditures (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id),
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  notes TEXT DEFAULT '',
  assigned_to VARCHAR(120),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_base_equipment_date
  ON purchases (base_id, equipment_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_source_equipment_date
  ON transfers (source_base_id, equipment_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_destination_equipment_date
  ON transfers (destination_base_id, equipment_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_assignments_base_equipment_date
  ON assignments (base_id, equipment_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenditures_base_equipment_date
  ON expenditures (base_id, equipment_type_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at);

INSERT INTO bases (name, location)
VALUES
  ('Fort Alpha', 'North Sector'),
  ('Fort Bravo', 'West Sector'),
  ('Fort Charlie', 'South Sector')
ON CONFLICT (name) DO NOTHING;

INSERT INTO equipment_types (name, category)
VALUES
  ('Utility Vehicle', 'VEHICLE'),
  ('Service Rifle', 'WEAPON'),
  ('Training Ammunition', 'AMMUNITION')
ON CONFLICT (name) DO NOTHING;
