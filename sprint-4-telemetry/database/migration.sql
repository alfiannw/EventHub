-- =============================================================================
-- SPRINT 4: DATABASE MIGRATION - TELEMETRY, LOGGING & NOTIFICATIONS SCHEMA
-- TARGET: PostgreSQL 15+
-- DESCRIPTION: System-wide audit logging, dynamic client-targeted notifications,
--              performance metrics index tracking, and advanced DB triggers.
-- =============================================================================

BEGIN;

-- 1. Create In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create System Audit Logs & DevOps Security Ledger Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id VARCHAR(100) NOT NULL,    -- UUID or username of Admin/Staff/System agent
    role VARCHAR(50) NOT NULL,        -- 'SUPER_ADMIN', 'EVENT_STAFF', 'SYSTEM', etc.
    action VARCHAR(100) NOT NULL,     -- e.g. 'PARTICIPANT_CHECKIN', 'SPIN_LUCKY_DRAW', 'SECURITY_VIOLATION'
    severity VARCHAR(20) NOT NULL CONSTRAINT check_log_severity CHECK (severity IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
    details TEXT NOT NULL,
    metadata JSONB,                   -- Structural representations of state, rate limits, stack traces
    ip_address VARCHAR(45),           -- Supports IPv4 & IPv6
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Container Performance Telemetry Metrics Table (DevOps Pulse tracking)
CREATE TABLE IF NOT EXISTS performance_telemetry_metrics (
    id BIGSERIAL PRIMARY KEY,
    node_id VARCHAR(50) NOT NULL,               -- Container ID / cluster node identifier
    active_websocket_connections INT NOT NULL DEFAULT 0,
    redis_cache_hit_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    db_pool_active_connections INT NOT NULL DEFAULT 0,
    queue_latency_ms INT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- HIGH-EFFICIENCY PERFORMANCE INDEXES
-- ==========================================

-- Fast lookup for unread notifications (minimizes header counts delay)
CREATE INDEX IF NOT EXISTS idx_notifications_unread_s4 
ON notifications (participant_id) 
WHERE is_read = FALSE;

-- Fast sequential scan of audit logs filterable by severity and chronological descending order
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_timestamp 
ON audit_logs (severity, timestamp DESC);

-- GIN Index on unstructured JSONB metadata fields for deep search
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin_s4 
ON audit_logs USING gin (metadata);

-- Performance metrics chronological indexing
CREATE INDEX IF NOT EXISTS idx_perf_telemetry_recorded_at 
ON performance_telemetry_metrics (recorded_at DESC);

-- ==========================================
-- COMPLIANCE & SECURITY AUDIT TRIGGERS
-- ==========================================

-- Trigger: Automatically audit point-ledger insertions to protect integrity
CREATE OR REPLACE FUNCTION audit_points_ledger_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, role, action, severity, details, metadata)
    VALUES (
        'SYSTEM_ENGINE',
        'SYSTEM',
        'POINT_LEDGER_TRANSACTION',
        CASE WHEN NEW.points_changed > 0 THEN 'SUCCESS'::varchar ELSE 'WARNING'::varchar END,
        'Point transaction processed for participant ' || NEW.participant_id || '. Amount: ' || NEW.points_changed || ' pts. Reason: ' || NEW.reason,
        json_build_object(
            'transaction_id', NEW.id,
            'participant_id', NEW.participant_id,
            'points_changed', NEW.points_changed,
            'running_balance', NEW.running_balance,
            'reason', NEW.reason
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_point_ledger
AFTER INSERT ON point_transactions_ledger
FOR EACH ROW
EXECUTE FUNCTION audit_points_ledger_transaction();

-- Seed initial test cluster metric
INSERT INTO performance_telemetry_metrics (node_id, active_websocket_connections, redis_cache_hit_rate, db_pool_active_connections, queue_latency_ms)
VALUES ('node-aws-ecs-01', 1048, 94.20, 14, 12);

COMMIT;
