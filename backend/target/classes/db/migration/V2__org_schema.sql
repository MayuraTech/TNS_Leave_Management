-- V2__org_schema.sql
-- Organizational hierarchy: departments, teams, manager_employee tables
-- Requirements: 4.1, 5.2

-- DEPARTMENTS table
CREATE TABLE departments (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- TEAMS table
-- manager_id references the user who manages this team
CREATE TABLE teams (
    id              BIGSERIAL   PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    department_id   BIGINT      NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    manager_id      BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_name_department UNIQUE (name, department_id)
);

-- Add department and team FK columns to users
-- A user belongs to at most one department and one team (Req 4.4, 4.5)
ALTER TABLE users
    ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    ADD COLUMN team_id       BIGINT REFERENCES teams(id)       ON DELETE SET NULL;

-- MANAGER_EMPLOYEE table
-- Tracks direct-report relationships; effective_to NULL means currently active (Req 5.2, 5.3)
CREATE TABLE manager_employee (
    id              BIGSERIAL   PRIMARY KEY,
    manager_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    effective_from  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to    TIMESTAMP,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    -- An employee can have only one active manager at a time (Req 5.3)
    CONSTRAINT uq_active_employee_manager UNIQUE (employee_id, effective_to)
);

-- Indexes for common lookup patterns
CREATE INDEX idx_departments_name              ON departments(name);
CREATE INDEX idx_teams_department_id           ON teams(department_id);
CREATE INDEX idx_teams_manager_id              ON teams(manager_id);
CREATE INDEX idx_users_department_id           ON users(department_id);
CREATE INDEX idx_users_team_id                 ON users(team_id);
CREATE INDEX idx_manager_employee_manager_id   ON manager_employee(manager_id);
CREATE INDEX idx_manager_employee_employee_id  ON manager_employee(employee_id);
CREATE INDEX idx_manager_employee_effective_to ON manager_employee(effective_to);
