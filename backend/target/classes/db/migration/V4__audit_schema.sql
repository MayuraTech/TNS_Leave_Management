-- V4__audit_schema.sql
-- Audit trail schema: audit_logs table
-- Requirements: 18.1

-- AUDIT_LOGS table
-- Records all significant system actions for compliance and traceability
CREATE TABLE audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    entity_type     VARCHAR(100)    NOT NULL,               -- e.g. USER, LEAVE_REQUEST, LEAVE_BALANCE
    entity_id       BIGINT          NOT NULL,               -- PK of the affected entity
    action_type     VARCHAR(50)     NOT NULL,               -- e.g. CREATE, UPDATE, DELETE, APPROVE, DENY
    old_value       TEXT,                                   -- JSON snapshot of state before change (nullable)
    new_value       TEXT,                                   -- JSON snapshot of state after change (nullable)
    performed_by    BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    performed_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address      VARCHAR(45)                             -- supports IPv4 and IPv6
);

-- Indexes for common audit query patterns (filter by user, entity, action, date range)
CREATE INDEX idx_audit_logs_performed_by    ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_entity_type     ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id       ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action_type     ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_performed_at    ON audit_logs(performed_at);
