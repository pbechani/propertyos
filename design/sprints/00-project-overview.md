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
- **LLM Gateway:** Unified API for OpenAI GPT-4, Anthropic Claude, Google Gemini — with provider fallback, rate limiting, and cost tracking
- **Primary LLM:** Anthropic Claude API — document AI, chatbots, NL-to-SQL, legal compliance
- **Vector DB:** pgvector (PostgreSQL extension) — 1536-dimension embeddings; Pinecone/Weaviate for scale
- **ML Framework:** scikit-learn, XGBoost, LightGBM, Prophet — pricing, anomaly detection, risk scoring
- **ML Ops:** MLflow — experiment tracking, model registry, staging → production promotion
- **OCR/Document AI:** AWS Textract or Google Document AI + Claude API for structured extraction
- **Speech:** OpenAI Whisper (voice-to-text for AI Design Assistant)
- **Computer Vision:** YOLOv8 (Ultralytics) — site safety, progress verification, plan recognition
- **Edge AI:** NVIDIA Jetson Orin for on-site camera inference
- **NL-to-SQL:** LangChain SQL Agent + Claude — natural language analytics queries
- **Time-Series:** TimescaleDB hypertables for IoT sensor data and anomaly detection
- **Background Jobs:** Celery + Redis — model retraining, report generation, async AI tasks
- **IoT Messaging:** MQTT (Eclipse Mosquitto) — lightweight pub/sub for sensor data
- **Scheduling Optimization:** Google OR-Tools — crew scheduling, route optimization

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

## AI Integration Principles

> **Data-first rule:** AI modules for pricing, risk scoring, maintenance prediction, and churn require 3–6 months of real platform data before meaningful models can be trained. Build data collection layers (Sprints 01–09) first, then train models in Sprints 11–12.

| AI Capability | Sprint | Model / Tool | Needs Data From |
|---|---|---|---|
| Document extraction (KYC, title deeds) | 11 | Claude API + OCR | Sprint 01, 03 |
| Contractor risk scoring | 11 | XGBoost regression | Sprint 07 |
| Property fraud / risk scoring | 11 | Weighted scoring + ML | Sprint 03 |
| Transaction anomaly detection | 11 | Prophet + z-score | Sprint 05 |
| Construction cost prediction | 11 | XGBoost + MLflow | Sprint 06, 08 |
| Legal compliance RAG | 11 | Claude + pgvector | Sprint 11 corpus |
| Natural language analytics | 11 | LangChain + Claude | Sprint 03–10 |
| BOQ AI cost estimation | 08 | XGBoost regression | Sprint 07 (pricing) |
| Progress photo verification | 09 | YOLOv8 + EXIF | Sprint 09 |
| Voice/text → floor plan | 12 | Claude + CAD engine | Sprint 11 (AI infra) |
| Tenant churn prediction | 12 | LightGBM | Sprint 12 (lifecycle) |

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
