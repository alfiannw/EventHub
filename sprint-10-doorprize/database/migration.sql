-- =============================================================================
-- SPRINT 10: DATABASE MIGRATION - DOOR PRIZE CLAIM ENGINE SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Manages real-time door prize claims, eligibility tier auditing, 
--              and automatic logging of claims to the main event audits list.
-- =============================================================================

BEGIN;

-- 1. Create Door Prize Claims Table
CREATE TABLE IF NOT EXISTS door_prize_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    eligible_tier VARCHAR(100) NOT NULL, -- 'Bronze Tier Selections', 'Silver Tier Selections', 'Gold Tier Selections'
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_ENGINE',
    -- Strict Rule: One participant can claim at most one door prize in the entire event
    CONSTRAINT unique_one_door_prize_per_participant UNIQUE (participant_id)
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for scanning claims logs
CREATE INDEX IF NOT EXISTS idx_door_prize_claims_lookup ON door_prize_claims (participant_id, claimed_at DESC);

-- Index for searching claimed tiers
CREATE INDEX IF NOT EXISTS idx_door_prize_claims_tier ON door_prize_claims (eligible_tier);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Automatically write to global audit log when a door prize is claimed
CREATE OR REPLACE FUNCTION audit_door_prize_claim_event()
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
        'DOOR_PRIZE_CLAIM',
        'SUCCESS',
        'Participant ' || COALESCE(p_name, NEW.participant_id::text) || ' (Company: ' || COALESCE(p_company, 'Unknown') || ') successfully claimed their door prize: ' || NEW.eligible_tier,
        json_build_object(
            'claim_id', NEW.id,
            'participant_id', NEW.participant_id,
            'tier', NEW.eligible_tier,
            'claimed_at', NEW.claimed_at,
            'actor_id', NEW.actor_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_door_prize_claim_event
AFTER INSERT ON door_prize_claims
FOR EACH ROW
EXECUTE FUNCTION audit_door_prize_claim_event();

COMMIT;
