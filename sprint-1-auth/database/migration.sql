-- =============================================================================
-- SPRINT 1: DATABASE MIGRATION - AUTHENTICATION & RBAC SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Implements users, roles, permissions, sessions, and audit logs
--              with cascade rules, indexes, and constraints.
-- =============================================================================

BEGIN;

-- 1. Create Roles Enum or Lookup Table
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'PARTICIPANT');

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'PARTICIPANT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Refresh Tokens / Sessions Table (Redis handles active memory, this is persistent storage)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Core Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'event:write', 'user:checkin', 'lucky-draw:spin'
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Role-Permission Join Table for Granular Access Control
CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

-- 6. High-Efficiency Indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_sessions_user ON user_sessions (user_id) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_expiry ON user_sessions (expires_at);

-- 7. Seed Core Permissions and Role Mappings
INSERT INTO permissions (name, description) VALUES
('event:config', 'Ability to modify main event details, themes and schedule.'),
('guests:import', 'Ability to bulk import guests and invitations.'),
('guests:checkin', 'Ability to check-in participants and print name tags.'),
('guests:view', 'Ability to view participant list and seating positions.'),
('songs:approve', 'Ability to moderate song request submissions.'),
('lucky-draw:spin', 'Ability to trigger the spinner and reward winners.'),
('audit:view', 'Ability to view real-time system audit logs and telemetry.');

-- Mapping permissions to Roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'ADMIN', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'MANAGER', id FROM permissions WHERE name IN ('guests:view', 'guests:import', 'songs:approve', 'lucky-draw:spin');

INSERT INTO role_permissions (role, permission_id)
SELECT 'STAFF', id FROM permissions WHERE name IN ('guests:view', 'guests:checkin', 'songs:approve');

-- Trigger to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

COMMIT;
