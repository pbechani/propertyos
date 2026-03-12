# Sprint 06-B — Database Schema Reference

> **AI-First Construction Project Management System**

---

## Table of Contents

- [3. Projects](#3-projects)
- [4. Task & Work Breakdown Structure](#4-task--work-breakdown-structure)
- [5. Scheduling](#5-scheduling)
- [6. Contractors & Suppliers](#6-contractors--suppliers)
- [7. Procurement & Materials](#7-procurement--materials)
- [8. Financial Management](#8-financial-management)
- [9. Site Monitoring](#9-site-monitoring)
- [10. Documents & Files](#10-documents--files)
- [11. Risk & Change Management](#11-risk--change-management)
- [12. AI Intelligence Layer](#12-ai-intelligence-layer)
- [13. Notifications & Automation](#13-notifications--automation)

---

## 3. Projects

### `projects`

| Field | Type |
|---|---|
| `id` | uuid |
| `organization_id` | uuid |
| `name` | varchar |
| `description` | text |
| `status` | varchar |
| `budget` | numeric |
| `start_date` | date |
| `end_date` | date |

### `project_locations`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `country` | varchar |
| `city` | varchar |
| `address` | varchar |
| `latitude` | decimal |
| `longitude` | decimal |

### `project_members`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `user_id` | uuid |
| `role` | varchar |

### `project_phases`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `name` | varchar |
| `start_date` | date |
| `end_date` | date |

### `milestones`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `name` | varchar |
| `due_date` | date |
| `status` | varchar |

---

## 4. Task & Work Breakdown Structure

### `tasks`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `phase_id` | uuid |
| `name` | varchar |
| `description` | text |
| `status` | varchar |
| `priority` | varchar |
| `start_date` | date |
| `end_date` | date |

### `task_dependencies`

| Field | Type |
|---|---|
| `id` | uuid |
| `task_id` | uuid |
| `depends_on_task_id` | uuid |

### `task_assignments`

| Field | Type |
|---|---|
| `id` | uuid |
| `task_id` | uuid |
| `user_id` | uuid |
| `assigned_at` | timestamp |

### `task_comments`

| Field | Type |
|---|---|
| `id` | uuid |
| `task_id` | uuid |
| `user_id` | uuid |
| `comment` | text |
| `created_at` | timestamp |

### `task_attachments`

| Field | Type |
|---|---|
| `id` | uuid |
| `task_id` | uuid |
| `file_id` | uuid |

---

## 5. Scheduling

### `schedules`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `baseline_version` | integer |
| `created_at` | timestamp |

### `schedule_tasks`

| Field | Type |
|---|---|
| `id` | uuid |
| `schedule_id` | uuid |
| `task_id` | uuid |
| `planned_start` | date |
| `planned_end` | date |

### `schedule_simulations`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `scenario_name` | varchar |
| `results` | jsonb |

---

## 6. Contractors & Suppliers

### `contractors`

| Field | Type |
|---|---|
| `id` | uuid |
| `organization_id` | uuid |
| `company_name` | varchar |
| `trade` | varchar |
| `rating` | numeric |
| `contact_email` | varchar |

### `contractor_documents`

| Field | Type |
|---|---|
| `id` | uuid |
| `contractor_id` | uuid |
| `document_id` | uuid |

### `supplier_companies`

| Field | Type |
|---|---|
| `id` | uuid |
| `name` | varchar |
| `contact_person` | varchar |
| `email` | varchar |

### `contractor_performance`

| Field | Type |
|---|---|
| `id` | uuid |
| `contractor_id` | uuid |
| `project_id` | uuid |
| `score` | numeric |
| `review` | text |

---

## 7. Procurement & Materials

### `materials`

| Field | Type |
|---|---|
| `id` | uuid |
| `name` | varchar |
| `category` | varchar |
| `unit` | varchar |

### `inventory`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `material_id` | uuid |
| `quantity` | numeric |

### `purchase_orders`

| Field | Type |
|---|---|
| `id` | uuid |
| `supplier_id` | uuid |
| `project_id` | uuid |
| `status` | varchar |
| `total_cost` | numeric |

### `purchase_order_items`

| Field | Type |
|---|---|
| `id` | uuid |
| `purchase_order_id` | uuid |
| `material_id` | uuid |
| `quantity` | numeric |
| `price` | numeric |

### `deliveries`

| Field | Type |
|---|---|
| `id` | uuid |
| `purchase_order_id` | uuid |
| `delivery_date` | date |
| `status` | varchar |

---

## 8. Financial Management

### `budgets`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `total_budget` | numeric |

### `budget_items`

| Field | Type |
|---|---|
| `id` | uuid |
| `budget_id` | uuid |
| `category` | varchar |
| `allocated_amount` | numeric |

### `expenses`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `category` | varchar |
| `amount` | numeric |
| `date` | date |

### `invoices`

| Field | Type |
|---|---|
| `id` | uuid |
| `contractor_id` | uuid |
| `project_id` | uuid |
| `amount` | numeric |
| `status` | varchar |

### `payments`

| Field | Type |
|---|---|
| `id` | uuid |
| `invoice_id` | uuid |
| `amount` | numeric |
| `paid_at` | timestamp |

---

## 9. Site Monitoring

### `site_logs`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `user_id` | uuid |
| `log_date` | date |
| `weather` | varchar |
| `notes` | text |

### `worker_attendance`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `worker_name` | varchar |
| `date` | date |
| `hours` | numeric |

### `inspections`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `inspector` | varchar |
| `result` | varchar |
| `report` | text |

### `safety_incidents`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `description` | text |
| `severity` | varchar |
| `date` | date |

---

## 10. Documents & Files

### `files`

| Field | Type |
|---|---|
| `id` | uuid |
| `file_name` | varchar |
| `file_path` | varchar |
| `file_type` | varchar |
| `uploaded_by` | uuid |
| `created_at` | timestamp |

### `documents`

| Field | Type |
|---|---|
| `id` | uuid |
| `file_id` | uuid |
| `project_id` | uuid |
| `document_type` | varchar |
| `version` | integer |

### `document_comments`

| Field | Type |
|---|---|
| `id` | uuid |
| `document_id` | uuid |
| `user_id` | uuid |
| `comment` | text |

---

## 11. Risk & Change Management

### `risks`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `description` | text |
| `probability` | numeric |
| `impact` | numeric |

### `issues`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `description` | text |
| `status` | varchar |

### `change_orders`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `description` | text |
| `cost_impact` | numeric |
| `schedule_impact_days` | integer |

---

## 12. AI Intelligence Layer

### `ai_agents`

| Field | Type |
|---|---|
| `id` | uuid |
| `name` | varchar |
| `role` | varchar |

### `ai_agent_tasks`

| Field | Type |
|---|---|
| `id` | uuid |
| `agent_id` | uuid |
| `task_type` | varchar |
| `payload` | jsonb |

### `ai_insights`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `agent_id` | uuid |
| `insight_type` | varchar |
| `content` | text |

### `ai_predictions`

| Field | Type |
|---|---|
| `id` | uuid |
| `project_id` | uuid |
| `prediction_type` | varchar |
| `prediction_data` | jsonb |

---

## 13. Notifications & Automation

### `notifications`

| Field | Type |
|---|---|
| `id` | uuid |
| `user_id` | uuid |
| `type` | varchar |
| `message` | text |
| `read_status` | boolean |

### `workflow_rules`

| Field | Type |
|---|---|
| `id` | uuid |
| `name` | varchar |
| `trigger_event` | varchar |
| `action` | jsonb |

### `workflow_logs`

| Field | Type |
|---|---|
| `id` | uuid |
| `rule_id` | uuid |
| `event_data` | jsonb |
| `executed_at` | timestamp |