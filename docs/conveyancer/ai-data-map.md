# AI Data Map

Defines how AI discovers relevant system data automatically.

## Entity Groups

### Case Data

Tables: Cases CaseTasks CaseEvents CaseNotes CaseDocuments

### Client Data

Tables: Clients ClientContacts ClientDocuments ClientKYC

### Property Data

Tables: Properties PropertyOwners PropertyTransactions PropertyMortgages

### Financial Data

Tables: Invoices Payments EscrowTransactions TrustAccountTransactions

### Document Data

Tables: Documents DocumentVersions DocumentTemplates

### AI Data

Tables: AIRequests AIResponses AIInsights AIEmbeddings

## Query Strategy

AI should: 1. Identify entity from user prompt 2. Map entity to tables
above 3. Execute structured query 4. Return summarized results
