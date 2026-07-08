-- =============================================================================
-- SPRINT 6: DATABASE MIGRATION - INVITATIONS, RSVPS & COORDINATION SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Event setting parameters, bulk guest imports tracking,
--              multi-channel reminder delivery logs, and audit trails.
-- =============================================================================

BEGIN;

-- 1. Create Event Config Table (KV Configuration Store)
CREATE TABLE IF NOT EXISTS event_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Event Config Parameters
INSERT INTO event_settings (key, value) VALUES
('event_name', 'EventHub Global Tech Summit 2026'),
('event_venue', 'Grand Ballroom, Plaza Hotel, San Francisco'),
('event_date', '2026-09-15'),
('event_time', '09:00 AM')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Create Reminder Delivery Logs Table (Multi-channel campaign audits)
CREATE TABLE IF NOT EXISTS reminder_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CONSTRAINT check_reminder_channel CHECK (channel IN ('EMAIL', 'WHATSAPP')),
    interval_stage VARCHAR(20) NOT NULL CONSTRAINT check_reminder_interval CHECK (interval_stage IN ('H-7', 'H-3', 'H-1', 'DAY-OF')),
    status VARCHAR(20) NOT NULL DEFAULT 'DELIVERED' CONSTRAINT check_delivery_status CHECK (status IN ('SENT', 'DELIVERED', 'FAILED')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for searching reminder logs by participant and interval stage
CREATE INDEX IF NOT EXISTS idx_reminder_logs_participant_stage 
ON reminder_delivery_logs (participant_id, interval_stage);

-- Index for tracking campaign delivery metrics chronologically
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at 
ON reminder_delivery_logs (sent_at DESC);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Log to the Audit Trails when an event setting is updated
CREATE OR REPLACE FUNCTION audit_event_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        'EVENT_COORDINATOR',
        'HOST',
        'SETTING_UPDATED',
        'SUCCESS',
        'Updated event setting "' || NEW.key || '" from "' || OLD.value || '" to "' || NEW.value || '"',
        json_build_object(
            'setting_key', NEW.key,
            'old_value', OLD.value,
            'new_value', NEW.value
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_event_settings
AFTER UPDATE ON event_settings
FOR EACH ROW
EXECUTE FUNCTION audit_event_settings_update();

COMMIT;
