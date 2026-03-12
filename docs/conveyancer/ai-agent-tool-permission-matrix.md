# AI Agent Tool Permission Matrix

Defines what data each AI agent can access and modify.

  --------------------------------------------------------------------------
  AI Agent        Read Access          Write Access           Actions
  --------------- -------------------- ---------------------- --------------
  Case            Cases, Tasks,        AIInsights             Summarize
  Intelligence    Documents                                   cases, detect
  Agent                                                       blockers

  Document        Documents            DocumentMetadata       Extract
  Intelligence                                                clauses,
  Agent                                                       classify
                                                              documents

  Compliance      Clients, KYC,        ComplianceFlags        AML checks,
  Agent           Transactions                                risk scoring

  Workflow Agent  Workflows, Tasks     Tasks,                 Create tasks,
                                       WorkflowExecutions     trigger
                                                              workflows

  Communication   Clients, Messages    Emails, Notifications  Draft and send
  Agent                                                       updates

  Risk Detection  Properties, Cases    RiskAlerts             Identify
  Agent                                                       conflicts or
                                                              anomalies

  Financial       Payments, Invoices   FinancialAlerts        Detect missing
  Intelligence                                                payments
  Agent                                                       

  Legal Research  KnowledgeBase        None                   Provide legal
  Agent                                                       explanations
  --------------------------------------------------------------------------
