-- =============================================================================
-- SPRINT 2: DATABASE MIGRATION - EVENT MANAGEMENT SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Core event configurations, multi-track schedules, themes, 
--              and seating arrangements.
-- =============================================================================

BEGIN;

-- 1. Create Event Status Enum
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- 2. Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL, -- references users(id) on real implementation
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    capacity INT NOT NULL DEFAULT 100,
    status event_status NOT NULL DEFAULT 'DRAFT',
    
    -- Branding & Theme customization
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'modern-slate',
    brand_primary VARCHAR(7) NOT NULL DEFAULT '#141414',
    brand_secondary VARCHAR(7) NOT NULL DEFAULT '#00FF00',
    cover_image_url TEXT,
    logo_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_event_times CHECK (end_time > start_time)
);

-- 3. Create Event Sessions (Multi-track schedule/agenda items)
CREATE TABLE IF NOT EXISTS event_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    speaker_name VARCHAR(150),
    speaker_title VARCHAR(150),
    speaker_bio TEXT,
    speaker_avatar TEXT,
    location_room VARCHAR(100), -- Room or online link
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_session_times CHECK (end_time > start_time)
);

-- 4. Create Event Tables (For physical seat planning)
CREATE TABLE IF NOT EXISTS event_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL, -- e.g., "VIP Table A", "Table 1"
    table_number INT NOT NULL,
    capacity INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (event_id, table_number)
);

-- 5. Create Seating Assignments Table
CREATE TABLE IF NOT EXISTS seating_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES event_tables(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL, -- references users or guests tables
    seat_number INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (table_id, seat_number),
    UNIQUE (table_id, guest_id)
);

-- 6. High-Efficiency Indexes
CREATE INDEX idx_events_organizer ON events (organizer_id);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_sessions_event ON event_sessions (event_id, start_time);
CREATE INDEX idx_tables_event ON event_tables (event_id);

-- 7. Trigger to auto-update updated_at timestamps
CREATE TRIGGER trg_update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_update_sessions_timestamp
BEFORE UPDATE ON event_sessions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_update_tables_timestamp
BEFORE UPDATE ON event_tables
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

COMMIT;
