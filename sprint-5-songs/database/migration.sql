-- =============================================================================
-- SPRINT 5: DATABASE MIGRATION - SONG REQUESTS BOARD SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: Live music cooperation database structure, status transitions,
--              high-frequency indexes, and double-entry integration triggers.
-- =============================================================================

BEGIN;

-- 1. Create Song Requests Table (Live Music Cooperation Board)
CREATE TABLE IF NOT EXISTS song_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    artist VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CONSTRAINT check_song_status CHECK (status IN ('PENDING', 'APPROVED', 'PLAYED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Index for live band/DJ display matching current played/approved playlist order
CREATE INDEX IF NOT EXISTS idx_song_requests_status_created 
ON song_requests (status, created_at ASC);

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_song_requests_participant 
ON song_requests (participant_id);

-- ==========================================
-- REAL-TIME GAMIFICATION TRIGGERS
-- ==========================================

-- Trigger: Automatically award points (+5) upon approval of a song request,
--          and log it to both the Audit Log and Point Transactions Ledger.
CREATE OR REPLACE FUNCTION audit_song_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
    points_reward_val INT := 5;
    curr_balance INT;
BEGIN
    -- Only act when a song request is approved
    IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN
        -- 1. Update participant points
        UPDATE participants
        SET current_points = current_points + points_reward_val
        WHERE id = NEW.participant_id
        RETURNING current_points INTO curr_balance;

        -- 2. Insert transaction into Ledger
        INSERT INTO point_transactions_ledger (participant_id, points_changed, running_balance, reason)
        VALUES (
            NEW.participant_id,
            points_reward_val,
            curr_balance,
            'Approved Song Request: "' || NEW.title || '" by ' || NEW.artist
        );

        -- 3. Log to Audit Trails
        INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
        VALUES (
            'DJ_BOOTH',
            'SYSTEM',
            'SONG_APPROVED',
            'SUCCESS',
            'Approved song request "' || NEW.title || '" by ' || NEW.artist || ' for participant ' || NEW.participant_id,
            json_build_object(
                'song_request_id', NEW.id,
                'participant_id', NEW.participant_id,
                'points_awarded', points_reward_val,
                'new_balance', curr_balance
            )
        );

        -- 4. Dispatch in-app notification to the participant
        INSERT INTO notifications (participant_id, title, message)
        VALUES (
            NEW.participant_id,
            'Song Request Approved! 🎵',
            'Your song request "' || NEW.title || '" has been approved by the DJ! You earned +' || points_reward_val || ' points.'
        );
    END IF;

    -- Standard log for other state changes
    IF NEW.status <> OLD.status AND NOT (NEW.status = 'APPROVED' AND OLD.status = 'PENDING') THEN
        INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
        VALUES (
            'DJ_BOOTH',
            'SYSTEM',
            'SONG_STATUS_UPDATE',
            'INFO',
            'Updated song request ID ' || NEW.id || ' status from ' || OLD.status || ' to ' || NEW.status,
            json_build_object(
                'song_request_id', NEW.id,
                'prev_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_song_requests
AFTER UPDATE OF status ON song_requests
FOR EACH ROW
EXECUTE FUNCTION audit_song_request_status_change();

-- Seed initial test songs
-- Note: Under typical seed, participants already exist.
-- This file complies with standalone DDL migration guidelines.

COMMIT;
