# Database Schema -- AI Conveyancing Case Management System

This schema outlines the core relational structure for an
enterprise-grade conveyancing platform. Typical production systems will
contain **100--120 tables**.

## Core Identity Tables

Users Roles Permissions RolePermissions UserRoles Firms FirmSettings

## Case Tables

Cases CaseStages CaseStatusHistory CaseEvents CaseTasks
CaseTaskAssignments CaseNotes CaseComments CaseTags CaseTagMap
CaseDeadlines

## Client Tables

Clients ClientContacts ClientAddresses ClientDocuments ClientKYC
ClientRiskProfiles ClientConsents

## Property Tables

Properties PropertyAddresses PropertyOwners PropertyOwnershipHistory
PropertyTransactions PropertyMortgages PropertyCertificates
PropertyDocuments

## Document Tables

Documents DocumentVersions DocumentTemplates DocumentCategories
DocumentTags DocumentAccessLogs DocumentSignatures

## Financial Tables

Invoices InvoiceItems Payments PaymentAllocations EscrowAccounts
EscrowTransactions TrustAccountTransactions FinancialReports

## Workflow Tables

Workflows WorkflowTemplates WorkflowSteps WorkflowStepAssignments
WorkflowTriggers WorkflowExecutions WorkflowLogs

## Communication Tables

Messages Emails EmailAttachments SMSMessages Notifications
NotificationPreferences

## AI System Tables

AIRequests AIResponses AIInsights AIEmbeddings AITrainingData
AIModelUsage AIAlerts

## Integration Tables

APIKeys Webhooks WebhookLogs IntegrationConnections IntegrationSyncLogs
