-- V3__leave_schema.sql
-- Leave management schema: leave_types, leave_policies, leave_requests,
-- leave_balances, leave_accrual_transactions, public_holidays
-- Requirements: 7.2, 9.1, 10.1, 15.4, 17.1

-- LEAVE_TYPES table
CREATE TABLE leave_types (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- LEAVE_POLICIES table
-- Defines accrual rules and constraints per leave type; effective_to NULL means currently active
CREATE TABLE leave_policies (
    id                  BIGSERIAL       PRIMARY KEY,
    leave_type_id       BIGINT          NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    accrual_rate        DECIMAL(10,2)   NOT NULL,           -- days accrued per period
    max_carry_over_days INT             NOT NULL DEFAULT 0, -- max days that roll over to next year
    min_notice_days     INT             NOT NULL DEFAULT 0, -- minimum advance notice required
    effective_from      TIMESTAMP       NOT NULL,
    effective_to        TIMESTAMP                           -- NULL means policy is currently active
);

-- LEAVE_REQUESTS table
CREATE TABLE leave_requests (
    id                  BIGSERIAL       PRIMARY KEY,
    employee_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id       BIGINT          NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date          DATE            NOT NULL,
    end_date            DATE            NOT NULL,
    total_days          DECIMAL(10,2)   NOT NULL,           -- BigDecimal to support fractional days (half-day, hourly)
    reason              VARCHAR(1000),
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, DENIED, CANCELLED
    duration_type       VARCHAR(20)     NOT NULL,           -- FULL_DAY, HALF_DAY, HOURLY
    session_type        VARCHAR(20),                        -- MORNING, AFTERNOON (nullable, for HALF_DAY only)
    duration_in_hours   DECIMAL(10,2),                      -- nullable, for HOURLY only (0.5–8 hours)
    approved_by         BIGINT          REFERENCES users(id) ON DELETE SET NULL, -- nullable
    approval_comments   VARCHAR(1000),
    submitted_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    processed_at        TIMESTAMP,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- LEAVE_BALANCES table
CREATE TABLE leave_balances (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id   BIGINT          NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    available_days  DECIMAL(10,2)   NOT NULL DEFAULT 0, -- supports fractional days (e.g. 10.5)
    accrued_days    DECIMAL(10,2)   NOT NULL DEFAULT 0,
    used_days       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    available_hours DECIMAL(10,2)   NOT NULL DEFAULT 0, -- for hourly permissions tracking
    used_hours      DECIMAL(10,2)   NOT NULL DEFAULT 0,
    year            INT             NOT NULL,
    last_updated    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leave_balance_user_type_year UNIQUE (user_id, leave_type_id, year)
);

-- LEAVE_ACCRUAL_TRANSACTIONS table
-- Audit trail for all balance changes (accruals, adjustments, deductions)
CREATE TABLE leave_accrual_transactions (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id   BIGINT          NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    amount          DECIMAL(10,2)   NOT NULL,
    transaction_type VARCHAR(30)    NOT NULL, -- ACCRUAL, ADJUSTMENT, DEDUCTION
    reason          VARCHAR(500),
    created_by      BIGINT          REFERENCES users(id) ON DELETE SET NULL, -- nullable (system-generated accruals have no user)
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- PUBLIC_HOLIDAYS table
CREATE TABLE public_holidays (
    id              BIGSERIAL   PRIMARY KEY,
    holiday_date    DATE        NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common lookup patterns
CREATE INDEX idx_leave_policies_leave_type_id           ON leave_policies(leave_type_id);
CREATE INDEX idx_leave_policies_effective_from          ON leave_policies(effective_from);

CREATE INDEX idx_leave_requests_employee_id             ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_leave_type_id           ON leave_requests(leave_type_id);
CREATE INDEX idx_leave_requests_approved_by             ON leave_requests(approved_by);
CREATE INDEX idx_leave_requests_status                  ON leave_requests(status);
CREATE INDEX idx_leave_requests_start_date              ON leave_requests(start_date);
CREATE INDEX idx_leave_requests_end_date                ON leave_requests(end_date);

CREATE INDEX idx_leave_balances_user_id                 ON leave_balances(user_id);
CREATE INDEX idx_leave_balances_leave_type_id           ON leave_balances(leave_type_id);
CREATE INDEX idx_leave_balances_year                    ON leave_balances(year);

CREATE INDEX idx_leave_accrual_transactions_user_id         ON leave_accrual_transactions(user_id);
CREATE INDEX idx_leave_accrual_transactions_leave_type_id   ON leave_accrual_transactions(leave_type_id);
CREATE INDEX idx_leave_accrual_transactions_created_by      ON leave_accrual_transactions(created_by);

CREATE INDEX idx_public_holidays_holiday_date           ON public_holidays(holiday_date);
