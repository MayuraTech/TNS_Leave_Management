-- V1__initial_schema.sql
-- Initial schema: users, roles, user_roles tables
-- Requirements: 1.1, 14.7

-- ROLES table
CREATE TABLE roles (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- USERS table
CREATE TABLE users (
    id                      BIGSERIAL       PRIMARY KEY,
    username                VARCHAR(100)    NOT NULL UNIQUE,
    email                   VARCHAR(255)    NOT NULL UNIQUE,
    password_hash           VARCHAR(255)    NOT NULL,
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    phone                   VARCHAR(50),
    emergency_contact       VARCHAR(255),
    address                 VARCHAR(500),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    failed_login_attempts   INT             NOT NULL DEFAULT 0,
    locked_until            TIMESTAMP,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- USER_ROLES join table
CREATE TABLE user_roles (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     BIGINT      NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- Indexes for common lookup patterns
CREATE INDEX idx_users_username        ON users(username);
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_is_active       ON users(is_active);
CREATE INDEX idx_user_roles_user_id    ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id    ON user_roles(role_id);
