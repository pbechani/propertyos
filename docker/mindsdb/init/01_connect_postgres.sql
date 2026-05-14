-- ─────────────────────────────────────────────────────────────────────────────
-- MindsDB Init: Connect to PRIBEC PostgreSQL
--
-- This script runs once when MindsDB starts and registers the local PostgreSQL
-- instance as a named data source that all models can query.
--
-- Run manually (Studio UI) or mount to /docker-entrypoint-initdb.d
-- ─────────────────────────────────────────────────────────────────────────────

-- Register PRIBEC PostgreSQL as a MindsDB integration
CREATE DATABASE IF NOT EXISTS pribec_postgres
WITH ENGINE = 'postgres',
PARAMETERS = {
  "host":     "postgres",
  "port":     5432,
  "database": "pribec_dev",
  "user":     "pribec",
  "password": "pribec_dev_password",
  "schema":   "analytics"
};
