-- =============================================================================
-- SPRINT 11: DATABASE MIGRATION - LUCKY DRAW WINNERS ENGINE SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Manages real-time lucky draw drawings, high-fidelity spinner audits,
--              and automatic logging of drawings to the main event audits list.
-- =============================================================================

BEGIN;

-- 1. Create Lucky Draw Winners Table
CREATE TABLE IF NOT EXISTS lucky_draw_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    prize_tier VARCHAR(100) NOT NULL, -- 'Grand Prize', 'Major Prize', 'Special Prize'
    prize_name VARCHAR(250) NOT NULL,
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_SPINNER',
    -- Strict Rule: One participant can win at most one lucky draw prize in the entire event
    CONSTRAINT unique_one_lucky_draw_prize_per_participant UNIQUE (participant_id)
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for scanning drawings logs
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_lookup ON lucky_draw_winners (participant_id, drawn_at DESC);

-- Index for searching drawn tiers
CREATE INDEX IF NOT EXISTS idx_lucky_draw_winners_tier ON lucky_draw_winners (prize_tier);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Automatically write to global audit log when a lucky draw winner is recorded
CREATE OR REPLACE FUNCTION audit_lucky_draw_win_event()
RETURNS TRIGGER AS $$
DECLARE
    p_name VARCHAR(100);
    p_company VARCHAR(150);
BEGIN
    -- Resolve participant details for audit logs
    SELECT name, company INTO p_name, p_company 
    FROM participants 
    WHERE id = NEW.participant_id;

    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        NEW.actor_id,
        CASE 
            WHEN NEW.actor_id LIKE 'Staff%' THEN 'STAFF'
            WHEN NEW.actor_id LIKE 'Admin%' THEN 'ADMIN'
            ELSE 'SYSTEM'
        END,
        'LUCKY_DRAW_WIN',
        'SUCCESS',
        'Participant ' || COALESCE(p_name, NEW.participant_id::text) || ' (Company: ' || COALESCE(p_company, 'Unknown') || ') won ' || NEW.prize_tier || ': ' || NEW.prize_name,
        json_build_object(
            'winner_id', NEW.id,
            'participant_id', NEW.participant_id,
            'prize_tier', NEW.prize_tier,
            'prize_name', NEW.prize_name,
            'drawn_at', NEW.drawn_at,
            'actor_id', NEW.actor_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_lucky_draw_win_event
AFTER INSERT ON lucky_draw_winners
FOR EACH ROW
EXECUTE FUNCTION audit_lucky_draw_win_event();

COMMIT;
