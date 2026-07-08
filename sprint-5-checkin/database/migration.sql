-- =============================================================================
-- SPRINT 5: DATABASE MIGRATION - QR CHECK-IN SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Manages participant check-in events, check-in log records,
--              entry gate coordination, and verification states.
-- =============================================================================

BEGIN;

-- Create Check-in Logs table
CREATE TABLE IF NOT EXISTS checkin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES qr_tickets(id) ON DELETE SET NULL,
    gate_name VARCHAR(100) NOT NULL DEFAULT 'Main Entrance',
    scanned_by VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CONSTRAINT check_checkin_status CHECK (status IN ('SUCCESS', 'FAILED', 'FLAGGED')),
    failure_reason TEXT,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for searching check-ins by participant ID
CREATE INDEX IF NOT EXISTS idx_checkin_logs_participant ON checkin_logs (participant_id);

-- Index for scanning gate logs analysis
CREATE INDEX IF NOT EXISTS idx_checkin_logs_gate ON checkin_logs (gate_name);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Log to the Audit Trails when a checkin event happens
CREATE OR REPLACE FUNCTION audit_checkin_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        NEW.scanned_by,
        'SCANNER',
        'PARTICIPANT_CHECKED_IN',
        CASE WHEN NEW.status = 'SUCCESS' THEN 'SUCCESS' ELSE 'ERROR' END,
        'Participant check-in processed at ' || NEW.gate_name || ' with status: ' || NEW.status,
        json_build_object(
            'log_id', NEW.id,
            'participant_id', NEW.participant_id,
            'gate', NEW.gate_name,
            'status', NEW.status,
            'reason', NEW.failure_reason
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_checkin_event
AFTER INSERT ON checkin_logs
FOR EACH ROW
EXECUTE FUNCTION audit_checkin_event();

COMMIT;
