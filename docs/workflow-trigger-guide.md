# Workflow System — Developer Guide
## How to Create Workflows, Add Trigger Points & Pass Data

> Written for junior developers. No assumed knowledge beyond basic TypeScript and NestJS.

---

## Table of Contents

1. [How the Whole System Works (The Big Picture)](#1-how-the-whole-system-works)
2. [The 5 Key Files You Need to Know](#2-the-5-key-files-you-need-to-know)
3. [What Happens When a Trigger Fires](#3-what-happens-when-a-trigger-fires)
4. [How Data Flows Through the Workflow](#4-how-data-flows-through-the-workflow)
5. [Step-by-Step: Create a New Workflow in the UI](#5-step-by-step-create-a-new-workflow-in-the-ui)
6. [Step-by-Step: Add a New Trigger Point in the Code](#6-step-by-step-add-a-new-trigger-point-in-the-code)
7. [Step-by-Step: Pass Custom Data from a Trigger](#7-step-by-step-pass-custom-data-from-a-trigger)
8. [Step-by-Step: Add a New Action Type](#8-step-by-step-add-a-new-action-type)
9. [The Full List of Available Triggers & Actions](#9-the-full-list-of-available-triggers--actions)
10. [How to Test Your Workflow](#10-how-to-test-your-workflow)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. How the Whole System Works

Think of the workflow system like an **automatic recipe**:

- A **trigger** is the *event* that starts the recipe (e.g. "a new lead signed up")
- **Nodes** are the *steps* of the recipe (send an email, wait 2 days, create a task)
- An **enrollment** is one specific *run* of the recipe for one specific person

```
Domain Event fires
(e.g. lead created)
        │
        ▼
WorkflowEngineService
  .triggerFor('New Lead', companyId, { leadId, leadEmail, leadName })
        │
        │  Looks up all active workflows with trigger_type = 'New Lead'
        │
        ▼
  For each matching workflow:
    Creates an enrollment record in property.workflow_enrollments
        │
        ▼
  Walks the node graph:
    Trigger node → Action node → Delay node → Condition node → ...
        │
        ▼
  Logs each step to property.workflow_step_logs
        │
        ▼
  Marks enrollment as 'completed' (or 'paused' if a Delay node is hit)
```

---

## 2. The 5 Key Files You Need to Know

| File | What it does |
|------|-------------|
| `apps/api/src/property/workflow-engine.service.ts` | The brain — runs nodes, sends emails, creates tasks |
| `apps/api/src/leads/leads.service.ts` | Example of where a trigger is *fired* (search for `triggerFor`) |
| `apps/web/src/components/open-houses/EnhancedWorkflowBuilder.tsx` | The drag-and-drop canvas UI |
| `apps/api/src/property/viewing.service.ts` | Saves/loads workflow definitions to/from the database |
| `apps/api/src/property/viewing.controller.ts` | The API endpoints the UI calls |

---

## 3. What Happens When a Trigger Fires

Here is the exact code path, step by step:

### Step 1 — A domain event fires in a service

```typescript
// apps/api/src/leads/leads.service.ts  (around line 281)

this.workflowEngine.triggerFor('New Lead', companyId, {
  leadId: lead.id,
  leadEmail: lead.email,
  leadName: lead.name,
});
```

`triggerFor` takes three arguments:
- `'New Lead'` — the trigger label string (must match what the agent typed in the UI)
- `companyId` — which company's workflows to check
- `{ leadId, leadEmail, leadName }` — the data passed INTO the workflow (the "context")

### Step 2 — The engine finds matching workflows

```typescript
// workflow-engine.service.ts  (around line 83)

SELECT * FROM property.agent_workflows
WHERE company_id = <companyId>
  AND status = 'active'
  AND LOWER(trigger_type) = LOWER('New Lead')   ← case-insensitive match
```

The `trigger_type` column in the DB is set to whatever the first trigger node's **label** was when the workflow was saved.

### Step 3 — An enrollment record is created

One row per lead, per workflow run, inserted into `property.workflow_enrollments`. The context data (`leadId`, `leadEmail`, `leadName`) is stored on this row.

### Step 4 — The engine walks the node graph

Starting from the first non-trigger node, it runs each node in turn:
- **Action node** → sends email / creates task / adds tag
- **Delay node** → pauses the enrollment and sets a `resume_at` timestamp (the scheduler picks it up later)
- **Condition node** → chooses YES branch or NO branch based on `enrollment.context`

### Step 5 — Each step is logged

Every executed node is logged to `property.workflow_step_logs`. This is what the Logs UI shows.

---

## 4. How Data Flows Through the Workflow

The **context object** is the carrier of all data. It travels with the enrollment from start to finish.

```
triggerFor('New Lead', companyId, {
  leadId:    'abc-123',        ← UUID of the lead
  leadEmail: 'jane@smith.com', ← used for send_email action
  leadName:  'Jane Smith',     ← used in email body {{name}} substitution
})
        │
        ▼
Stored in: property.workflow_enrollments
  - lead_id    = 'abc-123'
  - lead_email = 'jane@smith.com'
  - lead_name  = 'Jane Smith'
  - context    = {}   ← extra JSONB bag for custom fields
        │
        ▼
Available inside executeNode() as:
  enrollment.lead_id
  enrollment.lead_email
  enrollment.lead_name
  enrollment.context.anything_you_put_here
```

The `context` JSONB column is an open bag — you can put anything extra in it. The condition node currently reads `enrollment.context.email_opened` to decide which branch to take.

---

## 5. Step-by-Step: Create a New Workflow in the UI

1. Go to **Open Houses → Workflows** tab
2. Click **Create Workflow**
3. The builder opens with a blank canvas
4. **Drag a Trigger** from the left panel onto the canvas (e.g. "New Lead")
5. **Drag an Action** (e.g. "Send Email") onto the canvas
6. **Connect them** — click the bottom dot (▼) of the Trigger node, then click the top dot (▲) of the Action node. A bezier line appears.
7. Configure the Action by clicking the node — a settings panel opens on the right
8. Add more nodes as needed (Delay, Condition, more Actions)
9. Give the workflow a name at the top
10. Toggle it **Active**
11. Click **Save**

> **Tip:** For a Condition (If/Then) node, there are two output dots — green (YES) and red (NO). Connect each to a different action.

> **To delete a connection:** hover over the grey line between two nodes and click it — it turns red and gets removed.

---

## 6. Step-by-Step: Add a New Trigger Point in the Code

Say you want a new trigger: **"Open House RSVP"** — fires when a lead RSVPs for an open house.

### A — Fire the trigger in the relevant service

Find the service where the RSVP is confirmed (e.g. `viewing.service.ts`) and add:

```typescript
// apps/api/src/property/viewing.service.ts

// 1. Inject WorkflowEngineService in the constructor:
constructor(
  private readonly prisma: PrismaService,
  private readonly workflowEngine: WorkflowEngineService,  // ← add this
) {}

// 2. After the RSVP is saved, fire the trigger:
if (this.workflowEngine) {
  this.workflowEngine
    .triggerFor('Open House RSVP', companyId, {
      leadId:    rsvp.lead_id,
      leadEmail: rsvp.lead_email,
      leadName:  rsvp.lead_name,
    })
    .catch(() => { /* non-critical — don't block the RSVP */ });
}
```

> **Important:** The string `'Open House RSVP'` is the trigger label. It must match exactly (case-insensitive) the label you put on the trigger node in the UI.

### B — Add the trigger template to the UI

Open `apps/web/src/components/open-houses/EnhancedWorkflowBuilder.tsx` and find `nodeTemplates.triggers`. Add a new entry:

```typescript
{
  id: 'open_house_rsvp',           // internal UI key (not used by the engine)
  type: 'trigger',
  label: 'Open House RSVP',        // ← THIS must match the string in triggerFor()
  description: 'When a lead RSVPs for an open house',
  icon: Calendar,                  // any lucide icon already imported
  color: '#06b6d4',
  bgColor: '#ecfeff',
  borderColor: '#06b6d4',
},
```

### C — Inject WorkflowEngineService into the module

Open the NestJS module that owns `ViewingService` (usually `property.module.ts`) and make sure `WorkflowEngineService` is in the `providers` array.

```typescript
// apps/api/src/property/property.module.ts
providers: [
  ViewingService,
  WorkflowEngineService,   // ← ensure it is here
  ...
],
```

That's it. Now agents can create a workflow with an "Open House RSVP" trigger and it will run automatically whenever a lead RSVPs.

---

## 7. Step-by-Step: Pass Custom Data from a Trigger

Sometimes you want to send more data than just `leadId/leadEmail/leadName`. Use the `context` field.

### A — Add data to the context when firing the trigger

```typescript
this.workflowEngine.triggerFor('Open House RSVP', companyId, {
  leadId:    rsvp.lead_id,
  leadEmail: rsvp.lead_email,
  leadName:  rsvp.lead_name,
  // ↓ put any extra data in context
  context: {
    propertyAddress: '123 Main Street',
    openHouseDate:   '2026-04-01',
    propertyId:      property.id,
  },
});
```

### B — Accept context in `triggerFor`

The current signature only accepts `{ leadId, leadEmail, leadName }`. You need to extend it:

```typescript
// workflow-engine.service.ts  — update the triggerFor signature

async triggerFor(
  triggerType: string,
  companyId: string,
  context: {
    leadId?:    string;
    leadEmail?: string | null;
    leadName?:  string | null;
    context?:   Record<string, unknown>;  // ← add this
  },
): Promise<void> {
```

### C — Store context when creating the enrollment

In `enrollLead()`, update the INSERT to include the context JSONB:

```typescript
// workflow-engine.service.ts  — inside enrollLead()

const [enrollment] = await this.prisma.$queryRaw<EnrollmentRow[]>`
  INSERT INTO property.workflow_enrollments
    (workflow_id, company_id, lead_id, lead_email, lead_name, current_node_id, context)
  VALUES (
    ${workflow.id}::uuid,
    ${companyId}::uuid,
    ${context.leadId ?? null}::uuid,
    ${context.leadEmail ?? null},
    ${context.leadName ?? null},
    ${firstNodeId},
    ${JSON.stringify(context.context ?? {})}::jsonb   ← add this
  )
  RETURNING *
`;
```

### D — Use context data inside an action node

Now in `executeAction()` you can read the data:

```typescript
case 'send_email': {
  const subject = node.config?.subject ?? 'Regarding your RSVP';
  const address = enrollment.context?.propertyAddress ?? 'the property';  // ← read it
  const body = `Hi ${enrollment.lead_name},\n\nSee you at ${address}!`;
  ...
}
```

---

## 8. Step-by-Step: Add a New Action Type

Say you want a new action: **"Send WhatsApp"**.

### A — Add the template to the UI

In `EnhancedWorkflowBuilder.tsx`, add to `nodeTemplates.actions`:

```typescript
{
  id: 'send_whatsapp',           // ← this is the templateId the engine uses
  type: 'action',
  label: 'Send WhatsApp',
  description: 'Send a WhatsApp message',
  icon: MessageSquare,
  color: '#25d366',
  bgColor: '#f0fdf4',
  borderColor: '#25d366',
},
```

### B — Handle the new templateId in the engine

In `workflow-engine.service.ts`, inside `executeAction()`, add a new `case`:

```typescript
case 'send_whatsapp': {
  const message = (node.config?.message as string) ?? 'Hello from your agent!';
  const phone   = enrollment.context?.phone as string ?? '';

  if (dryRun) {
    return { ...base, message: `Would send WhatsApp "${message}" to ${phone || '(no phone)'}` };
  }

  // Call your WhatsApp API here
  await this.whatsappService.send(phone, message);

  return { ...base, message: `WhatsApp sent: "${message}"` };
}
```

### C — Add a config field in the ConfigurationPanel (optional)

In `EnhancedWorkflowBuilder.tsx`, inside the `ConfigurationPanel` component, add:

```tsx
{node.type === 'action' && node.templateId === 'send_whatsapp' && (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
    <textarea
      value={node.config.message || ''}
      onChange={(e) => onUpdate({ config: { ...node.config, message: e.target.value } })}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg ..."
      placeholder="Hi {{name}}, ..."
    />
  </div>
)}
```

---

## 9. The Full List of Available Triggers & Actions

### Currently Wired Triggers (will actually fire)

| Label | Where it fires | File |
|-------|---------------|------|
| `New Lead` | When a lead is created | `leads.service.ts:281` |

### UI-Only Triggers (display in builder but NOT yet wired)

| Label | What it should represent |
|-------|--------------------------|
| `Form Submit` | Contact form submitted |
| `Property Viewed` | Lead views a property listing |

> To wire these: follow [Section 6](#6-step-by-step-add-a-new-trigger-point-in-the-code)

### Available Actions

| templateId | What it does | Fully implemented? |
|-----------|-------------|-------------------|
| `send_email` | Sends email via `NotificationService` | ✅ Yes |
| `send_sms` | Logs SMS intent (no SMS provider yet) | ⚠️ Stub |
| `create_task` | Inserts into `sales.lead_tasks` | ✅ Yes |
| `add_tag` | Logs tag intent (no tag table yet) | ⚠️ Stub |

### Available Logic Nodes

| type | What it does |
|------|-------------|
| `delay` | Pauses enrollment, resumes after N hours/days |
| `condition` | Branches YES/NO based on `enrollment.context.email_opened` |

---

## 10. How to Test Your Workflow

### Option A — Test Run button (recommended during development)

1. Build your workflow in the UI
2. Click **Test Run** in the header
3. A results panel shows each node: what it *would* do without sending any real emails

The test run uses a fake lead (`preview@example.com`) and simulates the `true` branch for conditions. Delay nodes are treated as instant.

### Option B — Create a real lead to fire the trigger

1. Save and activate your workflow with a `New Lead` trigger
2. Go to the Leads section and create a new lead
3. The engine fires asynchronously — wait a second
4. Go back to the workflow and click **Logs** to see the run

### Option C — Query the database directly

```sql
-- See all enrollments for a workflow
SELECT * FROM property.workflow_enrollments
WHERE workflow_id = '<your-workflow-uuid>'
ORDER BY created_at DESC;

-- See the step-by-step log for one enrollment
SELECT * FROM property.workflow_step_logs
WHERE enrollment_id = '<enrollment-uuid>'
ORDER BY executed_at ASC;
```

---

## 11. Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Workflow never runs when a lead is created | Workflow is `inactive` | Toggle it Active and Save |
| Workflow `trigger_type` in DB doesn't match | You used the node `id` not the `label` | The engine matches on `label` — check `property.agent_workflows.trigger_type` column |
| Emails not sending | `NotificationService` not configured | Check SMTP env vars |
| Delay never resumes | Scheduler not running | `WorkflowSchedulerService` uses `@Cron` — ensure it is registered in the module |
| Context data is null inside an action | Didn't pass `context` to `triggerFor` | See [Section 7](#7-step-by-step-pass-custom-data-from-a-trigger) |
| New action falls through as "skipped" | `templateId` doesn't match the `case` in `executeAction` | Check the `id` in your node template matches the `case 'xxx':` in `workflow-engine.service.ts` |
| Test Run says "Save the workflow first" | `workflow.id` does not exist | Save the workflow once before running Test Run |

---

## Quick Reference: The Trigger Label Rule

> **The string you pass to `triggerFor()` must exactly match the `label` on the trigger node the agent drags onto the canvas (case-insensitive).**

```
triggerFor('Open House RSVP', ...)
               ↑
               must match
               ↓
nodeTemplate.label = 'Open House RSVP'
               ↓
saved to DB as trigger_type = 'Open House RSVP'
               ↓
matched by: LOWER(trigger_type) = LOWER('Open House RSVP')
```

The `id` field on a node template (e.g. `open_house_rsvp`) is only used as a React key and for the configuration panel — the engine never sees it.
