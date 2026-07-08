-- =============================================================================
-- SPRINT 9: DATABASE MIGRATION - LEADERBOARD & SCORE AUDITING SYSTEM SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Manages real-time point adjustments, participant rankings, 
--              milestone reward unlocks, and automated audit trails.
-- =============================================================================

BEGIN;

-- 1. Create Leaderboard Score Adjustments Log Table
CREATE TABLE IF NOT EXISTS leaderboard_score_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    points_delta INT NOT NULL,
    current_total INT NOT NULL,
    reason_code VARCHAR(100) NOT NULL, -- 'CHECK_IN', 'FEEDBACK', 'SONG_REQUEST', 'PHOTO_WALL', 'SPOT_AWARD', 'MANUAL_CORRECTION'
    description TEXT,
    actor_id VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_ENGINE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Participant Milestone Rewards Table
CREATE TABLE IF NOT EXISTS participant_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    milestone_name VARCHAR(100) NOT NULL, -- 'BRONZE_PASS', 'SILVER_LOUNGE', 'GOLD_RAFFLE_VIP'
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    UNIQUE(participant_id, milestone_name)
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for instant points sorting (descending leaderboard retrieval)
CREATE INDEX IF NOT EXISTS idx_participants_points_desc ON participants (points DESC);

-- Index for tracking score adjustments for specific participant profile views
CREATE INDEX IF NOT EXISTS idx_score_logs_participant ON leaderboard_score_logs (participant_id);

-- Index for searching milestones unlocked
CREATE INDEX IF NOT EXISTS idx_participant_milestones_status ON participant_milestones (participant_id, milestone_name);

-- ==========================================
-- REAL-TIME COORDINATION & AUDIT TRIGGERS
-- ==========================================

-- Trigger: Automatically write to global audit log when a score adjustment occurs
CREATE OR REPLACE FUNCTION audit_score_adjustment_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        NEW.actor_id,
        CASE 
            WHEN NEW.actor_id LIKE 'Staff%' THEN 'STAFF'
            WHEN NEW.actor_id LIKE 'Admin%' THEN 'ADMIN'
            ELSE 'SYSTEM'
        END,
        'SCORE_ADJUSTMENT',
        CASE 
            WHEN NEW.points_delta >= 10 THEN 'SUCCESS'
            WHEN NEW.points_delta < 0 THEN 'WARNING'
            ELSE 'INFO'
        END,
        'Score adjustment processed for participant: ' || NEW.participant_id || ' (Delta: ' || NEW.points_delta || ', New Score: ' || NEW.current_total || ')',
        json_build_object(
            'log_id', NEW.id,
            'delta', NEW.points_delta,
            'total', NEW.current_total,
            'reason', NEW.reason_code,
            'desc', NEW.description
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_score_adjustment_event
AFTER INSERT ON leaderboard_score_logs
FOR EACH ROW
EXECUTE FUNCTION audit_score_adjustment_event();

COMMIT;
