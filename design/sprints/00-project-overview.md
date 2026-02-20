# Real Estate & Construction Trust Platform — Project Overview

## Vision
Build a trusted digital infrastructure for property buying, construction management, and supplier marketplaces targeting **emerging markets** — with a focus on diaspora confidence, transparency, and fraud prevention.

## Core Value Proposition
A **financial-grade ledger platform** combining:
- Construction operations management
- Trust & audit infrastructure
- Real estate intelligence engine

## Tech Stack Decisions

### Backend
- **Runtime:** Node.js (NestJS) or Go for services
- **Database:** PostgreSQL (primary, ACID-compliant, schema-per-bounded-context)
- **Cache:** Redis (sessions, rate limiting, queues)
- **Message Broker:** RabbitMQ or Kafka (event-driven architecture)
- **Search:** OpenSearch or Elasticsearch
- **Object Storage:** S3-compatible (AWS S3 or MinIO)
- **Event Sourcing:** Append-only event store for all financial transactions

### Frontend
- **Web:** Next.js (SSR for SEO on property listings)
- **Mobile:** React Native (offline-first architecture required)
- **Mobile local DB:** SQLite with encrypted storage

### AI/ML Infrastructure
- **LLM Gateway:** Unified API for OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Vector DB:** Pinecone / Weaviate / Qdrant
- **OCR/Document AI:** AWS Textract or Google Document AI
- **Speech:** OpenAI Whisper (voice-to-text)
- **Computer Vision:** Custom models + cloud vision APIs

### Infrastructure
- **Cloud:** AWS / GCP / Azure
- **Containers:** Docker + Kubernetes
- **CI/CD:** GitHub Actions
- **IaC:** Terraform
- **Observability:** ELK stack, Prometheus, Grafana, Sentry

---

## Architecture Philosophy

**Approach:** Modular monolith → extracted services → microservices (only if scale demands)

**Non-negotiable Principles:**
1. **Security by design** — Financial-grade, no shortcuts
2. **Auditability as core primitive** — Every action has an immutable log entry
3. **Offline-first mobile** — Construction workers operate with poor connectivity
4. **Event sourcing for financials** — Double-entry ledger, no data loss tolerance
5. **Multi-tenant & multi-country ready** — Multi-currency, multi-language from day one

---

## Bounded Contexts (Domain Model)

| # | Context | Description |
|---|---------|-------------|
| 1 | Identity & Trust | Auth, KYC, RBAC, fraud reporting |
| 2 | Property Marketplace | Listings, search, verification, ownership |
| 3 | Sales Progression | 14-stage legal purchase pipeline |
| 4 | Financial & Escrow | Ledger, escrow, payments, multi-currency |
| 5 | Construction Management | Projects, milestones, BOQ, stages |
| 6 | Contractor & Supplier | Marketplaces, RFQ, ratings |
| 7 | Logistics & Transport | Truck operator marketplace, live tracking |
| 8 | Government Inspection | Compliance workflow, certificates |
| 9 | Risk & Intelligence | Scoring, anomaly detection, analytics |
| 10 | AI Engine | LLM, RAG, legal compliance, document AI |
| 11 | AI Design | Voice/text → floor plans → BOQ |
| 12 | Lifecycle Management | Warranty, maintenance, rental |

---

## User Roles (RBAC)

| Role | Description |
|------|-------------|
| Buyer/Seller | Purchase or sell property |
| Investor | Property investment, portfolio view |
| Contractor | Build projects, submit bids |
| Supplier | Sell materials, manage catalog |
| Agent | List properties, manage sales |
| Conveyancer/Lawyer | Legal workflow, stage progression |
| Inspector | Government & independent inspections |
| Admin | Platform administration |
| Truck Operator | Logistics & delivery |

---

## Security Requirements (Non-Negotiable)
- JWT authentication + OAuth (Google, Apple)
- MFA for all financial actions
- AES-256 encryption at rest
- TLS 1.3 in transit
- Append-only audit logs: `event_id`, `actor_id`, `action`, `timestamp`, `ip`, `device_metadata`
- Two-step approval for high-value transactions
- RBAC enforced at API gateway level

---

## Phased Roadmap Summary

| Milestone | Phases | Timeline |
|-----------|--------|----------|
| MVP | 0–5 | ~30 weeks |
| Marketplace Complete | 0–10 | ~60 weeks |
| AI Layer Complete | 0–13 | ~92 weeks |
| Full Platform | 0–18 | ~130 weeks |

---

## File Conventions for This Project
- `sprint-XX-*.md` — Sprint context files for Claude Code
- Each sprint file contains: Goal, Data Models, API Endpoints, Acceptance Criteria, Dependencies
- Always read the relevant sprint file before generating code for that sprint
