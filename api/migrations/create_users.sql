-- Users schema for authentication
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_users_username ON auth.users(username);

COMMENT ON SCHEMA auth IS 'Authentication and user management';
COMMENT ON TABLE auth.users IS 'Application users for intervention authentication';
COMMENT ON COLUMN auth.users.id IS 'Primary key';
COMMENT ON COLUMN auth.users.username IS 'Unique login username';
COMMENT ON COLUMN auth.users.display_name IS 'Display name shown on interventions (created_by)';
COMMENT ON COLUMN auth.users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN auth.users.role IS 'User role: admin or user';
COMMENT ON COLUMN auth.users.active IS 'Whether the account is active (soft delete)';
COMMENT ON COLUMN auth.users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN auth.users.updated_at IS 'Last update timestamp';
