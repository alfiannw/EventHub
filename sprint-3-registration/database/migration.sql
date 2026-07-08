-- =============================================================================
-- SPRINT 3: DATABASE MIGRATION - PARTICIPANT REGISTRATION & RSVP SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Handles participant profile generation, email registrations,
--              RSVP response tracking, and profile metadata.
-- =============================================================================

BEGIN;

-- 1. Create RSVP Status Check Constraint
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    avatar_url TEXT,
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CONSTRAINT check_rsvp_status CHECK (rsvp_status IN ('YES', 'NO', 'PENDING')),
    qr_code TEXT,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    points INT NOT NULL DEFAULT 0,
    table_number VARCHAR(100) DEFAULT 'Unassigned',
    seat_number VARCHAR(100) DEFAULT 'Unassigned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for searching participant records by email
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email ON participants (email);

-- Index for tracking RSVP responses
CREATE INDEX IF NOT EXISTS idx_participants_rsvp_status ON participants (rsvp_status);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Log to the Audit Trails when a participant profile is updated
CREATE OR REPLACE FUNCTION audit_participant_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        'PARTICIPANT_PORTAL',
        'GUEST',
        'PARTICIPANT_UPDATED',
        'INFO',
        'Updated registration details for guest ' || NEW.name || ' (' || NEW.email || ')',
        json_build_object(
            'participant_id', NEW.id,
            'old_rsvp', OLD.rsvp_status,
            'new_rsvp', NEW.rsvp_status,
            'old_company', OLD.company,
            'new_company', NEW.company
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_participant_update
AFTER UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION audit_participant_update();

COMMIT;
