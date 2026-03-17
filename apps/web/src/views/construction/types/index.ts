// Core Types
export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'delayed';
  location: string;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  manager: string;
  phase: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contractors: number;
  milestones: number;
  completedMilestones: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  startDate: string;
  dueDate: string;
  progress: number;
  dependencies: string[];
  phase: string;
  contractor?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: string;
  }[];
}

export interface Contractor {
  id: string;
  name: string;
  type: string;
  rating: number;
  projectsCompleted: number;
  activeProjects: number;
  performance: number;
  license: string;
  licenseExpiry: string;
  insurance: string;
  insuranceExpiry: string;
  specialties: string[];
  status: 'active' | 'pending' | 'suspended';
  contact: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  yearEstablished?: number;
  employeeCount?: number;
  description?: string;
  certifications?: string[];
  safetyRating?: number;
  onTimeDelivery?: number;
  qualityScore?: number;
  communicationScore?: number;
  licenses?: {
    id: string;
    type: string;
    number: string;
    issuedBy: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'pending';
  }[];
  insurancePolicies?: {
    id: string;
    type: string;
    provider: string;
    policyNumber: string;
    coverage: string;
    effectiveDate: string;
    expiryDate: string;
    status: 'active' | 'expired';
  }[];
  pastProjects?: {
    id: string;
    name: string;
    client: string;
    value: number;
    duration: string;
    completionDate: string;
    rating: number;
  }[];
  paymentHistory?: {
    id: string;
    projectId: string;
    projectName: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: 'paid' | 'pending' | 'overdue' | 'partial';
    invoiceNumber: string;
  }[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectId: string;
  projectName: string;
  supplier: string;
  supplierId: string;
  items: {
    id: string;
    material: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalValue: number;
  deliveryDate: string;
  orderDate: string;
  status: 'draft' | 'pending-approval' | 'approved' | 'in-transit' | 'delivered' | 'cancelled' | 'partially-delivered';
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  deliveryAddress: string;
  notes?: string;
  trackingNumber?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  paymentTerms?: string;
  shippingMethod?: string;
}

export interface InventoryItem {
  id: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  reorderPoint: number;
  supplier: string;
  supplierId: string;
  location: string;
  locationId: string;
  unitCost: number;
  totalValue: number;
  lastRestocked: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstocked';
  sku?: string;
  description?: string;
  imageUrl?: string;
}

export interface FinancialData {
  projectId: string;
  projectName: string;
  totalBudget: number;
  spentToDate: number;
  committed: number;
  remaining: number;
  forecastTotal: number;
  variance: number;
  variancePercentage: number;
  categories: {
    category: string;
    budgeted: number;
    spent: number;
    committed: number;
    remaining: number;
    percentage: number;
  }[];
  monthlyData: {
    month: string;
    budgeted: number;
    actual: number;
    forecast: number;
    cashIn: number;
    cashOut: number;
    netCashFlow: number;
  }[];
  expenses: {
    id: string;
    date: string;
    category: string;
    description: string;
    vendor: string;
    amount: number;
    status: 'paid' | 'pending' | 'approved';
    invoiceNumber?: string;
  }[];
}

export interface Budget {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  spent: number;
  committed: number;
  remaining: number;
  variance: number;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  deliveryDate: string;
  status: 'ordered' | 'in-transit' | 'delivered' | 'delayed';
}

export interface Risk {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  category: 'schedule' | 'budget' | 'safety' | 'quality' | 'regulatory' | 'technical' | 'environmental' | 'contractual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigationPlan: string;
  mitigation?: string;
  contingencyPlan?: string;
  status: 'identified' | 'monitoring' | 'mitigated' | 'closed';
  owner: string;
  ownerRole: string;
  dateIdentified: string;
  targetCloseDate?: string;
  actualCloseDate?: string;
  cost?: number;
  actions?: {
    id: string;
    description: string;
    responsible: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
}

export interface ChangeOrder {
  id: string;
  changeId: string; // Display ID like "CO-2026-001"
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  reason: string;
  category: 'design' | 'scope' | 'site-conditions' | 'client-request' | 'regulatory' | 'unforeseen' | 'value-engineering';
  costImpact: number; // Positive or negative
  scheduleImpact: number; // Days added or subtracted
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'implemented';
  approvalStage: 'pending' | 'technical-review' | 'cost-review' | 'client-approval' | 'final-approval' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  requestedByRole: string;
  requestDate: string;
  requiredByDate?: string;
  approvals: {
    stage: string;
    approver: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  }[];
  affectedAreas: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: string;
  }[];
  implementationDate?: string;
  finalCost?: number;
  finalScheduleImpact?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'project-manager' | 'engineer' | 'contractor' | 'viewer';
  roleDisplay: string;
  department?: string;
  projects: string[];
  projectNames: string[];
  lastLogin: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  phone?: string;
  location?: string;
  permissions?: string[];
}

export interface ScheduleTask {
  id: string;
  name: string;
  phase: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  progress: number; // 0-100
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string[];
  dependencies: string[]; // IDs of tasks that must complete first
  isMilestone: boolean;
  isCriticalPath: boolean;
  resources: {
    crew: number;
    equipment: string[];
  };
  cost: number;
  notes?: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  color: string;
  startDate: string;
  endDate: string;
  progress: number;
  budget: number;
  tasksCount: number;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'idle' | 'analyzing' | 'offline' | 'processing';
  accuracy: number; // 0-100
  tasksCompleted: number;
  timeSaved: string; // e.g., "120 hours"
  lastActive: string;
  capabilities: string[];
  insights: AIInsight[];
  automationRules: number;
  role?: string;
  specialty?: string;
}

export interface AIInsight {
  id: string;
  agentId: string;
  type: 'recommendation' | 'alert' | 'optimization' | 'prediction' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string; // e.g., "Save $50K", "2 weeks faster"
  confidence: number; // 0-100
  timestamp: string;
  actionable: boolean;
  actions?: {
    label: string;
    action: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  agentName?: string;
  attachments?: {
    type: string;
    name: string;
    url: string;
  }[];
}

export interface AIAnalysis {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  result?: any;
  startedAt: string;
  completedAt?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  documentCount: number;
  totalSize: string;
  lastModified: string;
}

export interface Document {
  id: string;
  name: string;
  folderId: string;
  type: 'pdf' | 'dwg' | 'xlsx' | 'docx' | 'jpg' | 'png' | 'rvt' | 'ifc' | 'drawing' | 'contract' | 'permit' | 'report' | 'other';
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  lastModified: string;
  status: 'draft' | 'pending-review' | 'approved' | 'rejected' | 'archived';
  version: string;
  versionHistory: DocumentVersion[];
  tags: string[];
  description?: string;
  category?: string;
  isCriticalPath?: boolean;
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  approvers?: {
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  }[];
  relatedDocuments?: string[];
}

export interface DocumentVersion {
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  changes: string;
  downloadUrl?: string;
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  action: 'uploaded' | 'viewed' | 'downloaded' | 'approved' | 'rejected' | 'commented' | 'shared' | 'deleted';
  user: string;
  timestamp: string;
  details?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  color: string;
  permissions: {
    [module: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    };
  };
}

export interface SystemModule {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'delay' | 'quality' | 'safety' | 'budget' | 'design';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee: string;
  reportedBy: string;
  reportedDate: string;
  resolvedDate?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  source: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contractor: string;
  contractorId: string;
  contractorCompany: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'rejected';
  category: string;
  projectId: string;
  projectName: string;
  description: string;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
  paymentTerms: string;
  taxAmount?: number;
  subtotal: number;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod?: string;
}

export interface SiteLog {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  weather: {
    condition: string;
    temperature: number;
    temperatureUnit: 'F' | 'C';
    precipitation?: string;
  };
  workersOnSite: {
    total: number;
    breakdown: {
      category: string;
      count: number;
    }[];
  };
  workCompleted: {
    id: string;
    description: string;
    location?: string;
    completionPercentage?: number;
  }[];
  issuesEncountered: {
    id: string;
    type: 'safety' | 'delay' | 'quality' | 'equipment' | 'material' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    resolution?: string;
    status: 'open' | 'resolved' | 'pending';
  }[];
  photos: SitePhoto[];
  notes?: string;
  reportedBy: string;
  reportedByRole: string;
  submittedAt?: string;
  status: 'draft' | 'submitted' | 'approved';
}

export interface SitePhoto {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  thumbnailUrl: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string;
  description?: string;
  location?: string;
  phase: string;
  tags: string[];
  fileSize: string;
  dimensions?: {
    width: number;
    height: number;
  };
}