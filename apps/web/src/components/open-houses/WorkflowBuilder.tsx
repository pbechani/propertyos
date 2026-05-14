// @ts-nocheck
"use client"
import { useState } from 'react';
import {
  Plus,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Zap,
  Play,
  Save,
  Settings,
  Trash2,
  Copy,
  ArrowRight,
  ChevronDown,
  X,
  Check,
  Calendar,
  Tag,
  User,
  Bell,
  Send,
  Phone,
  FileText,
  Star,
  Filter,
  CircleDot,
  Circle,
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'tag';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Connection {
  from: string;
  to: string;
  type?: 'true' | 'false';
}

const nodeTemplates = {
  trigger: [
    {
      id: 'new_lead',
      icon: User,
      label: 'New Lead Created',
      description: 'Triggers when a new lead is added',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      id: 'form_submitted',
      icon: FileText,
      label: 'Form Submitted',
      description: 'Triggers when a contact form is submitted',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      id: 'property_viewed',
      icon: CircleDot,
      label: 'Property Viewed',
      description: 'Triggers when lead views a property',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
    },
  ],
  action: [
    {
      id: 'send_email',
      icon: Mail,
      label: 'Send Email',
      description: 'Send an automated email',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      id: 'send_sms',
      icon: MessageSquare,
      label: 'Send SMS',
      description: 'Send a text message',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      id: 'create_task',
      icon: Bell,
      label: 'Create Task',
      description: 'Create a task for team member',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      id: 'schedule_call',
      icon: Phone,
      label: 'Schedule Call',
      description: 'Schedule a follow-up call',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  ],
  condition: [
    {
      id: 'check_response',
      icon: GitBranch,
      label: 'Check Response',
      description: 'Branch based on email response',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    },
    {
      id: 'check_score',
      icon: Star,
      label: 'Check Lead Score',
      description: 'Branch based on lead score',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      id: 'check_property',
      icon: Filter,
      label: 'Check Property Interest',
      description: 'Branch based on property criteria',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
    },
  ],
  delay: [
    {
      id: 'wait_hours',
      icon: Clock,
      label: 'Wait (Hours)',
      description: 'Wait for specified hours',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
    {
      id: 'wait_days',
      icon: Calendar,
      label: 'Wait (Days)',
      description: 'Wait for specified days',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
  ],
  tag: [
    {
      id: 'add_tag',
      icon: Tag,
      label: 'Add Tag',
      description: 'Add a tag to the lead',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
    },
    {
      id: 'remove_tag',
      icon: Tag,
      label: 'Remove Tag',
      description: 'Remove a tag from the lead',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
    },
  ],
};

const sampleWorkflow: WorkflowNode[] = [
  {
    id: '1',
    type: 'trigger',
    label: 'New Lead Created',
    config: {},
    position: { x: 100, y: 50 },
    connections: ['2'],
  },
  {
    id: '2',
    type: 'action',
    label: 'Send Welcome Email',
    config: {
      template: 'welcome_email',
      subject: 'Welcome! Let\'s find your dream home',
    },
    position: { x: 100, y: 180 },
    connections: ['3'],
  },
  {
    id: '3',
    type: 'delay',
    label: 'Wait 2 Days',
    config: { duration: 2, unit: 'days' },
    position: { x: 100, y: 310 },
    connections: ['4'],
  },
  {
    id: '4',
    type: 'condition',
    label: 'Email Opened?',
    config: { condition: 'email_opened' },
    position: { x: 100, y: 440 },
    connections: ['5', '6'],
  },
  {
    id: '5',
    type: 'action',
    label: 'Send Property Matches',
    config: {
      template: 'property_matches',
      subject: 'Properties that match your criteria',
    },
    position: { x: 300, y: 570 },
    connections: [],
  },
  {
    id: '6',
    type: 'action',
    label: 'Send Re-engagement Email',
    config: {
      template: 'reengagement',
      subject: 'Still looking for a home?',
    },
    position: { x: -100, y: 570 },
    connections: [],
  },
];

export function WorkflowBuilder({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(sampleWorkflow);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [workflowName, setWorkflowName] = useState('New Lead Welcome Sequence');
  const [isActive, setIsActive] = useState(false);

  const addNode = (template: any, type: string) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: type as any,
      label: template.label,
      config: {},
      position: { x: 100, y: nodes.length * 130 + 50 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
    setShowNodePicker(false);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodeLabel = (nodeId: string, label: string) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, label } : n)));
  };

  const getNodeTemplate = (node: WorkflowNode) => {
    const templates = nodeTemplates[node.type];
    return templates.find((t) => node.label.includes(t.label)) || templates[0];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="text-xl font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-slate-900 rounded px-2 -ml-2"
                />
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-600">Automated Follow-up Sequence</span>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-1.5"
                  >
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          isActive ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Play className="w-4 h-4" />
                Activate
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Node Library */}
          <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Workflow Steps</h3>

              {/* Triggers */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  TRIGGERS
                </h4>
                <div className="space-y-2">
                  {nodeTemplates.trigger.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addNode(template, 'trigger')}
                        className={`w-full p-3 rounded-lg border ${template.border} ${template.bg} hover:shadow-sm transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${template.border} border`}>
                            <Icon className={`w-4 h-4 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${template.color} mb-0.5`}>
                              {template.label}
                            </p>
                            <p className="text-xs text-slate-600">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  ACTIONS
                </h4>
                <div className="space-y-2">
                  {nodeTemplates.action.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addNode(template, 'action')}
                        className={`w-full p-3 rounded-lg border ${template.border} ${template.bg} hover:shadow-sm transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${template.border} border`}>
                            <Icon className={`w-4 h-4 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${template.color} mb-0.5`}>
                              {template.label}
                            </p>
                            <p className="text-xs text-slate-600">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditions */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  CONDITIONS
                </h4>
                <div className="space-y-2">
                  {nodeTemplates.condition.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addNode(template, 'condition')}
                        className={`w-full p-3 rounded-lg border ${template.border} ${template.bg} hover:shadow-sm transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${template.border} border`}>
                            <Icon className={`w-4 h-4 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${template.color} mb-0.5`}>
                              {template.label}
                            </p>
                            <p className="text-xs text-slate-600">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delays */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  DELAYS
                </h4>
                <div className="space-y-2">
                  {nodeTemplates.delay.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addNode(template, 'delay')}
                        className={`w-full p-3 rounded-lg border ${template.border} ${template.bg} hover:shadow-sm transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${template.border} border`}>
                            <Icon className={`w-4 h-4 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${template.color} mb-0.5`}>
                              {template.label}
                            </p>
                            <p className="text-xs text-slate-600">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  TAGS
                </h4>
                <div className="space-y-2">
                  {nodeTemplates.tag.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => addNode(template, 'tag')}
                        className={`w-full p-3 rounded-lg border ${template.border} ${template.bg} hover:shadow-sm transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${template.border} border`}>
                            <Icon className={`w-4 h-4 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${template.color} mb-0.5`}>
                              {template.label}
                            </p>
                            <p className="text-xs text-slate-600">{template.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-8 relative">
            <WorkflowCanvas
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onDeleteNode={deleteNode}
              onUpdateLabel={updateNodeLabel}
            />
          </div>

          {/* Right Sidebar - Node Configuration */}
          {selectedNode && (
            <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
              <NodeConfiguration
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={(updates) => {
                  setNodes(
                    nodes.map((n) =>
                      n.id === selectedNode.id ? { ...n, ...updates } : n
                    )
                  );
                  setSelectedNode({ ...selectedNode, ...updates });
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white rounded-b-2xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-slate-600">
                <strong className="text-slate-900">{nodes.length}</strong> steps
              </span>
              <span className="text-slate-600">
                <strong className="text-slate-900">
                  {nodes.filter((n) => n.type === 'trigger').length}
                </strong>{' '}
                triggers
              </span>
              <span className="text-slate-600">
                <strong className="text-slate-900">
                  {nodes.filter((n) => n.type === 'action').length}
                </strong>{' '}
                actions
              </span>
              <span className="text-slate-600">
                <strong className="text-slate-900">
                  {nodes.filter((n) => n.type === 'condition').length}
                </strong>{' '}
                conditions
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span>Last saved: Never</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowCanvas({
  nodes,
  selectedNode,
  onSelectNode,
  onDeleteNode,
  onUpdateLabel,
}: {
  nodes: WorkflowNode[];
  selectedNode: WorkflowNode | null;
  onSelectNode: (node: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateLabel: (nodeId: string, label: string) => void;
}) {
  const getNodeTemplate = (node: WorkflowNode) => {
    const templates = nodeTemplates[node.type];
    return (
      templates.find((t) => node.label.toLowerCase().includes(t.label.toLowerCase())) ||
      templates[0]
    );
  };

  return (
    <div className="relative min-w-[800px] min-h-[1000px]">
      {/* Connection Lines */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {nodes.map((node) =>
          node.connections.map((targetId, index) => {
            const targetNode = nodes.find((n) => n.id === targetId);
            if (!targetNode) return null;

            const isCondition = node.type === 'condition';
            const isTruePath = index === 0;
            const offset = isCondition ? (isTruePath ? 60 : -60) : 0;

            const startX = node.position.x + 150 + offset;
            const startY = node.position.y + 100;
            const endX = targetNode.position.x + 150;
            const endY = targetNode.position.y;

            const midY = (startY + endY) / 2;

            return (
              <g key={`${node.id}-${targetId}`}>
                <path
                  d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
                  stroke={isTruePath ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={isCondition ? '5,5' : '0'}
                />
                <circle cx={endX} cy={endY} r="4" fill={isTruePath ? '#10b981' : '#ef4444'} />
                {isCondition && (
                  <text
                    x={startX + 10}
                    y={startY + 20}
                    fontSize="12"
                    fill={isTruePath ? '#10b981' : '#ef4444'}
                    fontWeight="600"
                  >
                    {isTruePath ? 'YES' : 'NO'}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const template = getNodeTemplate(node);
        const Icon = template.icon;
        const isSelected = selectedNode?.id === node.id;
        const isCondition = node.type === 'condition';

        return (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.position.x,
              top: node.position.y,
              zIndex: isSelected ? 10 : 1,
            }}
          >
            <div
              onClick={() => onSelectNode(node)}
              className={`w-80 bg-white rounded-xl border-2 transition-all cursor-pointer group ${
                isSelected
                  ? `${template.border} shadow-lg`
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Node Header */}
              <div className={`p-4 ${template.bg} rounded-t-xl border-b ${template.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border ${template.border}`}>
                    <Icon className={`w-5 h-5 ${template.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase ${template.color}`}>
                        {node.type}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={node.label}
                      onChange={(e) => onUpdateLabel(node.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full font-medium ${template.color} bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-slate-900 rounded px-1 -ml-1`}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                  </button>
                </div>
              </div>

              {/* Node Content */}
              <div className="p-4">
                {node.type === 'action' && node.config.subject && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">Subject</p>
                    <p className="text-sm text-slate-900">{node.config.subject}</p>
                  </div>
                )}
                {node.type === 'delay' && node.config.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-900">
                      Wait {node.config.duration} {node.config.unit}
                    </p>
                  </div>
                )}
                {node.type === 'condition' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="w-4 h-4" />
                      <p className="text-sm font-medium">If True</p>
                    </div>
                    <div className="flex items-center gap-2 text-rose-600">
                      <X className="w-4 h-4" />
                      <p className="text-sm font-medium">If False</p>
                    </div>
                  </div>
                )}
                {node.type === 'trigger' && (
                  <p className="text-sm text-slate-600">Starts workflow when triggered</p>
                )}
              </div>

              {/* Connection Points */}
              {node.type !== 'condition' && (
                <>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-300 rounded-full border-2 border-white" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-300 rounded-full border-2 border-white" />
                </>
              )}
              {node.type === 'condition' && (
                <>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-300 rounded-full border-2 border-white" />
                  <div className="absolute -bottom-2 left-1/2 translate-x-12 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-16 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NodeConfiguration({
  node,
  onClose,
  onUpdate,
}: {
  node: WorkflowNode;
  onClose: () => void;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
}) {
  const template = nodeTemplates[node.type].find((t) =>
    node.label.toLowerCase().includes(t.label.toLowerCase())
  ) || nodeTemplates[node.type][0];
  const Icon = template.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 ${template.bg} rounded-lg flex items-center justify-center border ${template.border}`}>
              <Icon className={`w-5 h-5 ${template.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{node.label}</h3>
              <p className="text-sm text-slate-600 capitalize">{node.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Configuration Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {node.type === 'action' && node.label.toLowerCase().includes('email') && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Template
              </label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option>Welcome Email</option>
                <option>Property Matches</option>
                <option>Follow-up Email</option>
                <option>Re-engagement Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
              <input
                type="text"
                defaultValue={node.config.subject || ''}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter subject line..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Body</label>
              <textarea
                rows={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                placeholder="Enter email content..."
                defaultValue="Hi {{first_name}},\n\nThank you for your interest in finding your dream home!\n\nWe're excited to help you on this journey.\n\nBest regards,\n{{agent_name}}"
              />
            </div>
          </>
        )}

        {node.type === 'delay' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Wait Duration</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  defaultValue={node.config.duration || 1}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  min="1"
                />
                <select
                  defaultValue={node.config.unit || 'days'}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Condition Type</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option>Email Opened</option>
                <option>Email Clicked</option>
                <option>Lead Score Above</option>
                <option>Tag Contains</option>
                <option>Property Viewed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter condition value..."
              />
            </div>
          </>
        )}

        {node.type === 'tag' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tag Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter tag name..."
              />
            </div>
          </>
        )}

        {/* Performance Stats */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Sent</span>
              <span className="text-sm font-semibold text-slate-900">142</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Opened</span>
              <span className="text-sm font-semibold text-emerald-600">89 (62.7%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Clicked</span>
              <span className="text-sm font-semibold text-blue-600">34 (23.9%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
