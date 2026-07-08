-- =============================================================================
-- SPRINT 4: DATABASE MIGRATION - QR CODE ENGINE SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Tracks generated QR code tickets, formats, encryption states,
--              scan metrics, and revocations.
-- =============================================================================

BEGIN;

-- 1. Create QR Format Constraint type representation
CREATE TABLE IF NOT EXISTS qr_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    qr_code_string VARCHAR(512) NOT NULL UNIQUE,
    format VARCHAR(50) NOT NULL DEFAULT 'QR_CODE' CONSTRAINT check_qr_format CHECK (format IN ('QR_CODE', 'BARCODE', 'DATA_MATRIX')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CONSTRAINT check_qr_status CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    scans_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for scanning and looking up QR codes instantly
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_tickets_string ON qr_tickets (qr_code_string);

-- Index for searching qr code passes by participant ID
CREATE INDEX IF NOT EXISTS idx_qr_tickets_participant ON qr_tickets (participant_id);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Log to the Audit Trails when a QR Code is generated or status changes
CREATE OR REPLACE FUNCTION audit_qr_ticket_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        'QR_ENGINE_SYSTEM',
        'SYSTEM',
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'QR_GENERATED'
            ELSE 'QR_STATUS_MODIFIED'
        END,
        'INFO',
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Generated new ' || NEW.format || ' ticket for participant ' || NEW.participant_id
            ELSE 'Modified status of QR code string (' || NEW.status || ') for participant ' || NEW.participant_id
        END,
        json_build_object(
            'ticket_id', NEW.id,
            'participant_id', NEW.participant_id,
            'qr_code', NEW.qr_code_string,
            'status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_qr_ticket_insert
AFTER INSERT ON qr_tickets
FOR EACH ROW
EXECUTE FUNCTION audit_qr_ticket_update();

CREATE TRIGGER trg_audit_qr_ticket_update
AFTER UPDATE OF status ON qr_tickets
FOR EACH ROW
EXECUTE FUNCTION audit_qr_ticket_update();

COMMIT;
