-- =============================================================================
-- SPRINT 6: DATABASE MIGRATION - BADGE PRINTING SYSTEM SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Manages custom badge designs, dimensions, printing queues, 
--              print job records, and hardware buffers.
-- =============================================================================

BEGIN;

-- 1. Create Badge Print Jobs Table
CREATE TABLE IF NOT EXISTS badge_print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD_PASS' CONSTRAINT check_template_type CHECK (template_type IN ('STANDARD_PASS', 'VIP_GOLD', 'EXHIBITOR_MEDIA', 'SPEAKER_PASS')),
    printer_id VARCHAR(100) NOT NULL DEFAULT 'PRINTER_MAIN_01',
    printed_by VARCHAR(255) NOT NULL DEFAULT 'REGISTRATION_DESK',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CONSTRAINT check_print_status CHECK (status IN ('PENDING', 'PRINTED', 'FAILED')),
    print_attempts INT NOT NULL DEFAULT 0,
    failure_reason TEXT,
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for scanning active printing queues
CREATE INDEX IF NOT EXISTS idx_badge_print_jobs_status ON badge_print_jobs (status);

-- Index for searching printing histories by participant
CREATE INDEX IF NOT EXISTS idx_badge_print_jobs_participant ON badge_print_jobs (participant_id);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Log to the Audit Trails when a Badge Print job is processed
CREATE OR REPLACE FUNCTION audit_badge_print_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        NEW.printed_by,
        'HOST',
        CASE 
            WHEN NEW.status = 'PRINTED' THEN 'BADGE_PRINTED'
            ELSE 'BADGE_PRINT_FAILED'
        END,
        CASE 
            WHEN NEW.status = 'PRINTED' THEN 'SUCCESS'
            ELSE 'ERROR'
        END,
        'Badge print job processed on printer ' || NEW.printer_id || ' with status: ' || NEW.status,
        json_build_object(
            'job_id', NEW.id,
            'participant_id', NEW.participant_id,
            'template', NEW.template_type,
            'status', NEW.status,
            'reason', NEW.failure_reason
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_badge_print_event
AFTER UPDATE OF status ON badge_print_jobs
FOR EACH ROW
EXECUTE FUNCTION audit_badge_print_event();

COMMIT;
