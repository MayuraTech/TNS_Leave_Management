-- V5__seed_roles.sql
-- Seed initial roles: EMPLOYEE, MANAGER, ADMINISTRATOR
-- Requirements: 3.1

INSERT INTO roles (name, description) VALUES
    ('EMPLOYEE',      'Standard employee with leave request and balance viewing permissions'),
    ('MANAGER',       'Team manager with leave approval and team calendar permissions'),
    ('ADMINISTRATOR', 'System administrator with full access to user management, policy configuration, and reporting');
