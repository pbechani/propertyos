# Changelog

All notable changes to the PRIBEC platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive unit tests for infrastructure modules
  - PrismaService tests (database connection, health checks, lifecycle)
  - RedisService tests (cache operations, JSON helpers, health checks)
  - VaultService tests (initialization, enabled/disabled modes)
  - Environment validation tests (schema validation, defaults, security)
  - MetricsService tests (Prometheus metrics, HTTP tracking, active connections)
  - MetricsController tests (endpoint responses, format validation)
- E2E infrastructure tests (`infrastructure.e2e-spec.ts`)
  - Health endpoint verification
  - Metrics endpoint testing
  - Security headers validation
  - Rate limiting verification
  - CORS handling
  - Input validation
  - Error handling
  - Database integration checks
  - API versioning enforcement
  - Observability (response time, uptime tracking)

### Fixed
- Prisma database layer integration with health checks
- Vault module properly configured with dynamic module pattern
- Baseline test suite for health endpoints (unit + E2E)
- Database module with PrismaService for connection management
- **Sprint 01 test coverage gap resolved** — Added 10 new test files
- Added missing dependencies: `joi`, `prom-client`, `@types/supertest`

---

## [0.1.0] - 2026-02-20

### Added
- Complete infrastructure foundation (Sprint 01)
- Turborepo monorepo with apps (api, web, mobile placeholder)
- NestJS API application with health check endpoints
- Next.js web application
- PostgreSQL database with 12 schema separation (identity, property, sales, financial, construction, marketplace, logistics, inspection, analytics, ai_engine, audit, common)
- Redis cache instance with AOF persistence
- RabbitMQ message broker with management UI
- MinIO S3-compatible object storage
- Elasticsearch + Kibana for centralized logging
- Prometheus + Grafana for metrics collection
- HashiCorp Vault for secrets management
- Sentry error tracking integration
- Docker Compose development environment (10 services)
- GitHub Actions CI/CD pipeline (lint, test, build, security-scan, deploy)
- Terraform infrastructure as code (VPC, RDS, ElastiCache, S3, ECS, ACM modules)
- SSL/TLS certificate configuration (local + production)
- Shared packages (shared-types, ui, config)

### Security
- Helmet.js security headers configured
- Rate limiting: 100 req/min default, 10 req/min for auth endpoints
- CORS whitelist configuration
- Input validation pipes
- Secret scanning in CI (TruffleHog)
- Vulnerability scanning (Trivy)
- Zero secrets committed to repository

### Documentation
- Comprehensive architecture specification (design/design.md)
- Sprint-based implementation plan (18 phases)
- Development workflow guide (CLAUDE.md)
- Project README with tech stack overview
- Sprint 01 detailed changelog
- Manual setup instructions

### Infrastructure
- Docker Compose with health checks for all services
- PostgreSQL init scripts for schema creation
- Prometheus scrape configuration
- Nginx HTTPS proxy configuration
- Vault policies and initialization scripts

---

## Development Philosophy

PRIBEC follows these core principles:
1. **Security by design** — Financial-grade, no shortcuts
2. **Auditability as core primitive** — Every action has immutable log entry
3. **Offline-first mobile** — Construction workers operate with poor connectivity
4. **Event sourcing for financials** — Double-entry ledger, zero data loss tolerance
5. **Multi-tenant & multi-country ready** — Multi-currency, multi-language from day one

---

[unreleased]: https://github.com/pribec/pribec/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pribec/pribec/releases/tag/v0.1.0
