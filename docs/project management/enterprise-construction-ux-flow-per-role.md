# Enterprise Construction Project Management Platform

## Full UX Flow Per Role

Version: 1.0\
Document Type: UX Flow & Role Interaction Specification

------------------------------------------------------------------------

# 1. Roles Covered

-   Owner / Client
-   Project Manager (PM)
-   Contractor / Subcontractor
-   HSE (Health, Safety & Environment Officer)

------------------------------------------------------------------------

# 2. OWNER / CLIENT UX FLOW

## Primary Goals

-   Monitor portfolio and project performance
-   Approve budgets and change orders
-   Review financial forecasts
-   Monitor enterprise risk exposure

## Entry Point

Login → Organization Selection → Portfolio Dashboard

## Flow A: Portfolio Oversight

1.  View Portfolio Dashboard (CPI, SPI, Risk, Capital Allocation)
2.  Drill into underperforming project
3.  Review Project Health Dashboard
4.  Analyze Cost Forecast & Earned Value
5.  Review Risk Register (High risks only)

## Flow B: Budget & Change Approval

1.  Receive Change Order notification
2.  Open Change Order screen
3.  Review cost & schedule impact
4.  Review attachments and evidence
5.  Approve / Reject
6.  Audit trail logged

## Flow C: Executive Reporting

1.  Open Executive Intelligence Dashboard
2.  Filter by date or region
3.  Compare project performance
4.  Export Board-level report

------------------------------------------------------------------------

# 3. PROJECT MANAGER (PM) UX FLOW

## Primary Goals

-   Plan and baseline project
-   Control cost and schedule
-   Manage risks
-   Coordinate contractors

## Entry Point

Login → Project Dashboard

## Flow A: Planning & Baseline

1.  Configure WBS
2.  Build schedule in Gantt
3.  Set baseline
4.  Upload contracts and cost codes

## Flow B: Cost Control

1.  Open Cost Tracking Dashboard
2.  Review Actual vs Planned
3.  Drill into Commitment Register
4.  Approve valuations
5.  Update forecast

## Flow C: Change Management

1.  Receive variation request
2.  Create Change Order
3.  Enter cost & time impact
4.  Link to schedule
5.  Submit to Owner

## Flow D: Schedule Recovery

1.  Identify delayed task
2.  Run What-If Scenario
3.  Adjust dependencies
4.  Communicate recovery plan

## Flow E: Risk Management

1.  Review Risk Register
2.  Assign mitigation tasks
3.  Monitor escalation triggers
4.  Report major risks

------------------------------------------------------------------------

# 4. CONTRACTOR / SUBCONTRACTOR UX FLOW

## Primary Goals

-   Execute assigned tasks
-   Submit progress updates
-   Submit invoices
-   Raise RFIs

## Entry Point

Login → My Tasks Dashboard

## Flow A: Daily Work Execution

1.  View assigned tasks
2.  Update progress %
3.  Upload photos
4.  Submit daily log

## Flow B: Payment Application

1.  Open Subcontractor Valuation screen
2.  Enter % complete
3.  Upload evidence
4.  Submit for approval

## Flow C: RFI Submission

1.  Submit RFI
2.  Attach drawing
3.  Track response

------------------------------------------------------------------------

# 5. HSE UX FLOW

## Primary Goals

-   Monitor site safety
-   Record incidents
-   Manage compliance
-   Escalate high-risk issues

## Entry Point

Login → HSE Dashboard

## Flow A: Incident Management

1.  Log incident
2.  Assign investigation
3.  Track corrective action
4.  Close incident

## Flow B: Site Inspection

1.  Open inspection checklist
2.  Flag non-compliance
3.  Assign corrective task
4.  Submit report

## Flow C: Permit to Work

1.  Review safety documentation
2.  Approve / Reject permit
3.  Log validity period

## Flow D: Risk Escalation

1.  Review risk heat map
2.  Identify safety risks
3.  Trigger escalation workflow

------------------------------------------------------------------------

# 6. Cross-Role Interaction Matrix

  Action                  Initiator    Approver   Impact
  ----------------------- ------------ ---------- --------------------
  Change Order            PM           Owner      Budget & Schedule
  Subcontract Valuation   Contractor   PM         Cost Update
  Incident Escalation     HSE          PM         Risk Update
  Risk Escalation         PM/HSE       Owner      Executive Alert
  Budget Approval         PM           Owner      Financial Baseline
  Permit to Work          Contractor   HSE        Safety Compliance

------------------------------------------------------------------------

End of UX Flow Specification
