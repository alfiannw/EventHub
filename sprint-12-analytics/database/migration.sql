-- =============================================================================
-- Database Schema Migration - Sprint 12: Analytics Dashboard Indexes
-- =============================================================================

-- Indexes for performance tuning of analytical queries

-- 1. Index on participant checked_in and points to speed up Live Leaderboards and Top Present List queries
CREATE INDEX IF NOT EXISTS idx_participants_analytics_leaderboard 
ON participants (checked_in, current_points DESC);

-- 2. Index on point transactions ledgers to optimize company averages calculations
CREATE INDEX IF NOT EXISTS idx_point_ledger_telemetry
ON point_transactions_ledger (participant_id, created_at DESC);

-- 3. GIN index on audit logs metadata to run fast structural JSON searches inside dashboards
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin 
ON audit_logs USING GIN (metadata);

-- 4. Index on audit logs severity & action for rapid panel filters
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_action
ON audit_logs (severity, action, timestamp DESC);
