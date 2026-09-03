-- Munderdifflin Control Plane - Schema Database Migrations (Initial Setup)

-- 1. Organizations (Multi-tenant container)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budget_limit NUMERIC(15, 2) DEFAULT 10000.00
);

-- 3. Employees
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    department_id VARCHAR(100) REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    authority_level INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active'
);

-- 4. Autonomous Agents / Capabilities
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(100) REFERENCES employees(id) ON DELETE CASCADE,
    capabilities TEXT[] DEFAULT '{}',
    is_autonomous BOOLEAN DEFAULT TRUE,
    daily_spend_limit NUMERIC(10, 4) DEFAULT 100.00
);

-- 5. Integrations Registry
CREATE TABLE IF NOT EXISTS integrations (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    authentication_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    health_status VARCHAR(50) DEFAULT 'HEALTHY'
);

-- 6. Credentials Metadata (Vault References - NEVER store raw keys)
CREATE TABLE IF NOT EXISTS credentials_metadata (
    id VARCHAR(100) PRIMARY KEY,
    integration_id VARCHAR(100) REFERENCES integrations(id) ON DELETE CASCADE,
    vault_reference_key VARCHAR(255) NOT NULL,
    last_rotated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Policy rules
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) REFERENCES organizations(id) ON DELETE CASCADE,
    tool VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    max_spending_limit NUMERIC(10, 2)
);

-- 8. Tool Executions (Logs execution durations and statuses)
CREATE TABLE IF NOT EXISTS tool_executions (
    id VARCHAR(100) PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES agents(id),
    tool VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    duration_ms INT NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(255) NOT NULL
);

-- 9. Human-In-The-Loop Approvals
CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(100) PRIMARY KEY,
    execution_id VARCHAR(100) NOT NULL,
    requested_by VARCHAR(100) REFERENCES employees(id),
    action VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approver VARCHAR(255),
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

-- 10. Audit events log (Immutable Records)
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(100) PRIMARY KEY,
    organization_id VARCHAR(100) NOT NULL,
    employee_id VARCHAR(100) NOT NULL,
    tool VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    parameters_hash VARCHAR(100) NOT NULL,
    result TEXT NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Event Outbox pattern for reliable microservice publishing
CREATE TABLE IF NOT EXISTS event_outbox (
    id VARCHAR(100) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
