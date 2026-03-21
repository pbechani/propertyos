// @ts-nocheck
"use client"
import { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { agentApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
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
  X,
  User,
  Tag,
  Bell,
  Phone,
  FileText,
  Star,
  Filter,
  Calendar,
  Home,
  Target,
  Send,
  CheckSquare,
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'tag';
  label: string;
  templateId: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface NodeTemplate {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'tag';
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const nodeTemplates: Record<string, NodeTemplate[]> = {
  triggers: [
    {
      id: 'new_lead',
      type: 'trigger',
      label: 'New Lead',
      description: 'When a new lead is created',
      icon: User,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
    },
    {
      id: 'form_submit',
      type: 'trigger',
      label: 'Form Submit',
      description: 'Contact form submission',
      icon: FileText,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#8b5cf6',
    },
    {
      id: 'property_view',
      type: 'trigger',
      label: 'Property Viewed',
      description: 'Lead views a property',
      icon: Home,
      color: '#06b6d4',
      bgColor: '#ecfeff',
      borderColor: '#06b6d4',
    },
  ],
  actions: [
    {
      id: 'send_email',
      type: 'action',
      label: 'Send Email',
      description: 'Send automated email',
      icon: Mail,
      color: '#10b981',
      bgColor: '#f0fdf4',
      borderColor: '#10b981',
    },
    {
      id: 'send_sms',
      type: 'action',
      label: 'Send SMS',
      description: 'Send text message',
      icon: MessageSquare,
      color: '#6366f1',
      bgColor: '#eef2ff',
      borderColor: '#6366f1',
    },
    {
      id: 'create_task',
      type: 'action',
      label: 'Create Task',
      description: 'Create a new task',
      icon: Bell,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
    },
    {
      id: 'add_tag',
      type: 'action',
      label: 'Add Tag',
      description: 'Add tag to lead',
      icon: Tag,
      color: '#ec4899',
      bgColor: '#fdf2f8',
      borderColor: '#ec4899',
    },
    {
      id: 'approval_form',
      type: 'action',
      label: 'Approval Form',
      description: 'Pause & wait for approve/reject response',
      icon: CheckSquare,
      color: '#0ea5e9',
      bgColor: '#f0f9ff',
      borderColor: '#0ea5e9',
    },
  ],
  logic: [
    {
      id: 'if_then',
      type: 'condition',
      label: 'If/Then Branch',
      description: 'Conditional branching',
      icon: GitBranch,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#8b5cf6',
    },
    {
      id: 'wait',
      type: 'delay',
      label: 'Wait',
      description: 'Add time delay',
      icon: Clock,
      color: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#64748b',
    },
  ],
};

const ItemTypes = {
  NODE_TEMPLATE: 'node_template',
  CANVAS_NODE: 'canvas_node',
};

export function EnhancedWorkflowBuilder({ onClose, workflow, onSave }: { onClose?: () => void; workflow?: any; onSave?: (payload: any) => void }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    workflow?.steps?.length
      ? workflow.steps.map((n: any, i: number) => ({
          ...n,
          connections: n.connections ?? [],
          position: n.position ?? { x: 400, y: 80 + i * 140 },
        }))
      : []
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name ?? 'New Workflow');
  const [isActive, setIsActive] = useState(workflow ? workflow.status === 'active' : true);
  const [testRunResults, setTestRunResults] = useState<{ workflow: string; steps: any[] } | null>(null);
  const [testRunLoading, setTestRunLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const payload = {
      name: workflowName,
      status: isActive ? 'active' : 'inactive',
      triggerType: triggerNode?.label ?? '',
      steps: nodes,
    };
    if (onSave) {
      setSaving(true);
      setSaveError(null);
      try {
        await onSave(payload);
      } catch (err: any) {
        setSaveError(err?.message ?? 'Failed to save workflow. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      onClose?.();
    }
  };

  const handleTestRun = async () => {
    if (!workflow?.id) {
      alert('Save the workflow first before running a test.');
      return;
    }
    setTestRunLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const result = await agentApi.testRunWorkflow(token, workflow.id, nodes);
      setTestRunResults(result);
    } catch (err: any) {
      alert(`Test run failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setTestRunLoading(false);
    }
  };

  const addNode = (template: NodeTemplate, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: template.type,
      label: template.label,
      templateId: template.id,
      config: {},
      position,
      connections: [],
    };
    setNodes(prev => [...prev, newNode]);
  };

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map((n) => (n.id === nodeId ? { ...n, position } : n)));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter((n) => n.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const connectNodes = (fromId: string, toId: string, outputIndex?: number) => {
    if (fromId === toId) return;
    setNodes(prev => prev.map(n => {
      if (n.id !== fromId) return n;
      if (n.type === 'condition' && outputIndex !== undefined) {
        const conns = [...(n.connections ?? [])];
        conns[outputIndex] = toId;
        return { ...n, connections: conns };
      }
      if ((n.connections ?? []).includes(toId)) return n;
      return { ...n, connections: [...(n.connections ?? []), toId] };
    }));
  };

  const disconnectNodes = (fromId: string, toId: string) => {
    setNodes(prev => prev.map(n =>
      n.id === fromId ? { ...n, connections: (n.connections ?? []).filter(c => c !== toId) } : n
    ));
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)));
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-50 rounded-2xl shadow-2xl w-full h-full max-w-[1800px] max-h-[95vh] flex flex-col">
          {/* Header */}
          <WorkflowHeader
            workflowName={workflowName}
            isActive={isActive}
            onNameChange={setWorkflowName}
            onToggleActive={() => setIsActive(!isActive)}
            onClose={onClose}
            onSave={handleSave}
            onTestRun={handleTestRun}
            testRunLoading={testRunLoading}
            saving={saving}
            saveError={saveError}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Node Templates */}
            <NodeLibrary onAddNode={addNode} />

            {/* Canvas */}
            <Canvas
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onMoveNode={moveNode}
              onDeleteNode={deleteNode}
              onAddNode={addNode}
              onConnectNodes={connectNodes}
              onDisconnectNodes={disconnectNodes}
            />

            {/* Right Sidebar - Configuration */}
            {selectedNode && (
              <ConfigurationPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={(updates) => updateNode(selectedNode.id, updates)}
              />
            )}
          </div>

          {/* Footer */}
          <WorkflowFooter nodes={nodes} />
        </div>
      </div>

      {/* Test Run Results Panel */}
      {testRunResults && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-slate-900/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Test Run Results</h3>
                <p className="text-sm text-slate-500">{testRunResults.workflow}</p>
              </div>
              <button
                onClick={() => setTestRunResults(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
              {testRunResults.steps.map((step: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      step.status === 'executed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : step.status === 'skipped'
                        ? 'bg-slate-100 text-slate-500'
                        : step.status === 'failed'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{step.label}</p>
                    <p className="text-xs text-slate-500">{step.message}</p>
                  </div>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      step.status === 'executed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : step.status === 'skipped'
                        ? 'bg-slate-50 text-slate-500'
                        : step.status === 'failed'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
              ))}
              {testRunResults.steps.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No steps to simulate.</p>
              )}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <p className="text-xs text-slate-500">Dry run — no emails sent, no tasks created.</p>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}

function WorkflowHeader({
  workflowName,
  isActive,
  onNameChange,
  onToggleActive,
  onClose,
  onSave,
  onTestRun,
  testRunLoading,
  saving,
  saveError,
}: {
  workflowName: string;
  isActive: boolean;
  onNameChange: (name: string) => void;
  onToggleActive: () => void;
  onClose?: () => void;
  onSave?: () => void;
  onTestRun?: () => void;
  testRunLoading?: boolean;
  saving?: boolean;
  saveError?: string | null;
}) {
  return (
    <div className="px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-xl font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-slate-900 rounded px-2 -ml-2"
            />
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-600">Automation Workflow</span>
              <button onClick={onToggleActive} className="flex items-center gap-1.5">
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
                <span
                  className={`text-sm font-medium ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saveError && (
              <p className="text-xs text-red-500 max-w-[200px] text-right">{saveError}</p>
            )}
          </div>
          <button
            onClick={onTestRun}
            disabled={testRunLoading}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-60"
          >
            <Play className="w-4 h-4" />
            {testRunLoading ? 'Running…' : 'Test Run'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NodeLibrary({ onAddNode }: { onAddNode: (template: NodeTemplate, position: { x: number; y: number }) => void }) {
  return (
    <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Building Blocks
        </h3>

        {/* Triggers */}
        <NodeCategory title="Triggers" icon={Zap} templates={nodeTemplates.triggers} />

        {/* Actions */}
        <NodeCategory title="Actions" icon={Send} templates={nodeTemplates.actions} />

        {/* Logic */}
        <NodeCategory title="Logic & Flow" icon={GitBranch} templates={nodeTemplates.logic} />
      </div>
    </div>
  );
}

function NodeCategory({
  title,
  icon: Icon,
  templates,
}: {
  title: string;
  icon: any;
  templates: NodeTemplate[];
}) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-medium text-slate-600 mb-3 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h4>
      <div className="space-y-2">
        {templates.map((template) => (
          <DraggableNodeTemplate key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function DraggableNodeTemplate({ template }: { template: NodeTemplate }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE_TEMPLATE,
    item: { template },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = template.icon;

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: template.bgColor,
        borderColor: template.borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ borderColor: template.borderColor, borderWidth: '1px' }}
        >
          <Icon className="w-4 h-4" style={{ color: template.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 mb-0.5">{template.label}</p>
          <p className="text-xs text-slate-600">{template.description}</p>
        </div>
      </div>
    </div>
  );
}

function Canvas({
  nodes,
  selectedNode,
  onSelectNode,
  onMoveNode,
  onDeleteNode,
  onAddNode,
  onConnectNodes,
  onDisconnectNodes,
}: {
  nodes: WorkflowNode[];
  selectedNode: WorkflowNode | null;
  onSelectNode: (node: WorkflowNode) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddNode: (template: NodeTemplate, position: { x: number; y: number }) => void;
  onConnectNodes: (fromId: string, toId: string, outputIndex?: number) => void;
  onDisconnectNodes: (fromId: string, toId: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState<{ fromNodeId: string; outputIndex?: number } | null>(null);
  const [connectingMouse, setConnectingMouse] = useState({ x: 0, y: 0 });

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE_TEMPLATE,
    drop: (item: { template: NodeTemplate }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: offset.x - canvasRect.left - 125,
          y: offset.y - canvasRect.top - 50,
        };
        onAddNode(item.template, position);
      }
    },
  }));

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectingMouse({
        x: e.clientX - rect.left + canvasRef.current.scrollLeft,
        y: e.clientY - rect.top + canvasRef.current.scrollTop,
      });
    }
  };

  const handleStartConnect = (fromNodeId: string, outputIndex?: number) => {
    setConnecting(prev =>
      prev?.fromNodeId === fromNodeId && prev?.outputIndex === outputIndex
        ? null
        : { fromNodeId, outputIndex }
    );
  };

  const handleCompleteConnect = (toNodeId: string) => {
    if (connecting) {
      onConnectNodes(connecting.fromNodeId, toNodeId, connecting.outputIndex);
      setConnecting(null);
    }
  };

  return (
    <div
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className="flex-1 overflow-auto bg-slate-50 relative"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        cursor: connecting ? 'crosshair' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onClick={() => setConnecting(null)}
    >
      {/* Connecting hint banner */}
      {connecting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
          Click the <strong>top dot</strong> of a node to connect · Click here to cancel
        </div>
      )}

      <div className="relative min-w-[1200px] min-h-[1200px] p-8">
        {/* Empty canvas hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-lg">Drag blocks from the left panel to start</p>
              <p className="text-slate-400 text-sm mt-1">Start with a Trigger, then add Actions and Logic</p>
            </div>
          </div>
        )}

        {/* Connection Lines */}
        <svg
          className="absolute inset-0"
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {nodes.map((node) =>
            (node.connections ?? []).map((targetId, index) => {
              const targetNode = nodes.find((n) => n.id === targetId);
              if (!targetNode) return null;

              const isTwoOutput = node.type === 'condition' || node.templateId === 'approval_form';
              const isApprovalForm = node.templateId === 'approval_form';
              const isTruePath = index === 0;

              let startX = node.position.x + 125;
              const startY = node.position.y + 110;

              if (isTwoOutput) {
                startX += isTruePath ? 60 : -60;
              }

              const endX = targetNode.position.x + 125;
              const endY = targetNode.position.y;

              const controlY = startY + (endY - startY) / 2;
              const pathD = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;

              const pathColor = isTwoOutput
                ? isTruePath
                  ? '#10b981'
                  : '#ef4444'
                : '#94a3b8';

              return (
                <g
                  key={`${node.id}-${targetId}`}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); onDisconnectNodes(node.id, targetId); }}
                >
                  <title>Click to remove this connection</title>
                  {/* Wide invisible hit area */}
                  <path d={pathD} stroke="transparent" strokeWidth="16" fill="none" />
                  {/* Visible line */}
                  <path
                    d={pathD}
                    stroke={pathColor}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={isTwoOutput ? '5,5' : '0'}
                    className="hover:stroke-rose-400 transition-colors"
                  />
                  <circle cx={endX} cy={endY} r="4" fill={pathColor} />
                  {isTwoOutput && (
                    <text
                      x={startX + (isTruePath ? 10 : -30)}
                      y={startY + 15}
                      fontSize="11"
                      fontWeight="600"
                      fill={pathColor}
                    >
                      {isTruePath ? (isApprovalForm ? 'APPROVED' : 'YES') : (isApprovalForm ? 'REJECTED' : 'NO')}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* In-progress connection line while user is connecting */}
          {connecting && (() => {
            const fromNode = nodes.find(n => n.id === connecting.fromNodeId);
            if (!fromNode) return null;
            let sx = fromNode.position.x + 125;
            const sy = fromNode.position.y + 110;
            if ((fromNode.type === 'condition' || fromNode.templateId === 'approval_form') && connecting.outputIndex !== undefined) {
              sx += connecting.outputIndex === 0 ? 60 : -60;
            }
            const ex = connectingMouse.x;
            const ey = connectingMouse.y;
            const cy2 = sy + (ey - sy) / 2;
            return (
              <path
                d={`M ${sx} ${sy} C ${sx} ${cy2}, ${ex} ${cy2}, ${ex} ${ey}`}
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                fill="none"
                pointerEvents="none"
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={() => onSelectNode(node)}
            onMove={(position) => onMoveNode(node.id, position)}
            onDelete={() => onDeleteNode(node.id)}
            connecting={connecting}
            onStartConnect={handleStartConnect}
            onCompleteConnect={handleCompleteConnect}
          />
        ))}
      </div>
    </div>
  );
}

function CanvasNode({
  node,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  connecting,
  onStartConnect,
  onCompleteConnect,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  connecting?: { fromNodeId: string; outputIndex?: number } | null;
  onStartConnect?: (fromNodeId: string, outputIndex?: number) => void;
  onCompleteConnect?: (toNodeId: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CANVAS_NODE,
    item: { nodeId: node.id, startPosition: node.position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.CANVAS_NODE,
    hover: (item: { nodeId: string; startPosition: { x: number; y: number } }, monitor) => {
      if (item.nodeId !== node.id) return;

      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const newPosition = {
          x: item.startPosition.x + delta.x,
          y: item.startPosition.y + delta.y,
        };
        onMove(newPosition);
      }
    },
  }));

  const allTemplates = Object.values(nodeTemplates).flat();
  const template =
    allTemplates.find((t) => t.id === node.templateId) ??
    allTemplates.find((t) => t.type === node.type) ??
    allTemplates[0];

  const Icon = template.icon;

  return (
    <div
      ref={(element) => drag(drop(element))}
      onClick={(e) => { e.stopPropagation(); if (!connecting) onSelect(); }}
      className={`absolute cursor-move transition-all group ${isDragging ? 'opacity-50' : ''}`}
      style={{
        left: node.position?.x ?? 0,
        top: node.position?.y ?? 0,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <div
        className={`w-64 bg-white rounded-xl shadow-md border-2 transition-all ${
          isSelected ? 'shadow-lg ring-2 ring-slate-900 ring-offset-2' : 'hover:shadow-lg'
        }`}
        style={{ borderColor: isSelected ? template.color : '#e2e8f0' }}
      >
        {/* Node Header */}
        <div
          className="px-4 py-3 rounded-t-xl border-b"
          style={{
            backgroundColor: template.bgColor,
            borderColor: template.borderColor,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ borderColor: template.borderColor, borderWidth: '1px' }}
            >
              <Icon className="w-5 h-5" style={{ color: template.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: template.color }}
              >
                {node.type}
              </span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{node.label}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all"
            >
              <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
            </button>
          </div>
        </div>

        {/* Node Content */}
        <div className="px-4 py-3">
          {node.type === 'action' && node.config.subject && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Subject</p>
              <p className="text-sm text-slate-900">{node.config.subject}</p>
            </div>
          )}
          {node.type === 'delay' && node.config.duration && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                {node.config.duration} {node.config.unit}
              </span>
            </div>
          )}
          {node.type === 'condition' && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium">If true</span>
              </div>
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-medium">If false</span>
              </div>
            </div>
          )}
          {node.type === 'action' && node.templateId === 'approval_form' && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium">If approved</span>
              </div>
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-medium">If rejected</span>
              </div>
            </div>
          )}
          {node.type === 'trigger' && (
            <p className="text-xs text-slate-600">{template.description}</p>
          )}
          {node.type === 'action' && node.templateId === 'create_task' && node.config.title && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Task</p>
              <p className="text-sm text-slate-900">{node.config.title}</p>
            </div>
          )}
        </div>

        {/* Input dot (top) — click to receive a connection */}
        <div
          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-sm transition-all
            ${connecting && connecting.fromNodeId !== node.id
              ? 'bg-blue-400 border-blue-600 scale-125 ring-2 ring-blue-200 cursor-cell'
              : 'bg-white border-slate-300 hover:border-blue-400 hover:scale-110 cursor-cell'
            }`}
          title="Drop connection here"
          onClick={(e) => {
            e.stopPropagation();
            if (connecting && connecting.fromNodeId !== node.id) {
              onCompleteConnect?.(node.id);
            }
          }}
        />

        {/* Output dots (bottom) — click to start drawing a connection */}
        {(node.type === 'condition' || node.templateId === 'approval_form') ? (
          <>
            {/* YES / Approved branch */}
            <div
              className={`absolute -bottom-2.5 left-1/2 translate-x-14 w-5 h-5 rounded-full border-2 shadow-sm transition-all cursor-crosshair
                ${connecting?.fromNodeId === node.id && connecting.outputIndex === 0
                  ? 'bg-emerald-700 border-white scale-125 ring-2 ring-emerald-300'
                  : 'bg-emerald-500 border-white hover:scale-125 hover:ring-2 hover:ring-emerald-200'
                }`}
              title={node.templateId === 'approval_form' ? 'Approved branch — click to connect' : 'YES branch — click to connect'}
              onClick={(e) => { e.stopPropagation(); onStartConnect?.(node.id, 0); }}
            />
            {/* NO / Rejected branch */}
            <div
              className={`absolute -bottom-2.5 left-1/2 -translate-x-[4.5rem] w-5 h-5 rounded-full border-2 shadow-sm transition-all cursor-crosshair
                ${connecting?.fromNodeId === node.id && connecting.outputIndex === 1
                  ? 'bg-rose-700 border-white scale-125 ring-2 ring-rose-300'
                  : 'bg-rose-500 border-white hover:scale-125 hover:ring-2 hover:ring-rose-200'
                }`}
              title={node.templateId === 'approval_form' ? 'Rejected branch — click to connect' : 'NO branch — click to connect'}
              onClick={(e) => { e.stopPropagation(); onStartConnect?.(node.id, 1); }}
            />
          </>
        ) : (
          <div
            className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 shadow-sm transition-all cursor-crosshair
              ${connecting?.fromNodeId === node.id
                ? 'bg-blue-500 border-blue-700 scale-125 ring-2 ring-blue-300'
                : 'bg-white border-slate-400 hover:bg-blue-400 hover:border-blue-600 hover:scale-125'
              }`}
            title="Click to connect to another node"
            onClick={(e) => { e.stopPropagation(); onStartConnect?.(node.id, 0); }}
          />
        )}
      </div>
    </div>
  );
}

function ConfigurationPanel({
  node,
  onClose,
  onUpdate,
}: {
  node: WorkflowNode;
  onClose: () => void;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
}) {
  const template = Object.values(nodeTemplates)
    .flat()
    .find((t) => t.id === node.templateId);

  if (!template) return null;

  const Icon = template.icon;

  return (
    <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: template.bgColor,
                borderColor: template.borderColor,
                borderWidth: '1px',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: template.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{node.label}</h3>
              <p className="text-xs text-slate-500 capitalize">{node.type}</p>
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

      {/* Configuration Form */}
      <div className="p-5 space-y-6">
        {node.type === 'action' && node.templateId === 'send_email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Template
              </label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm">
                <option>Welcome Email</option>
                <option>Follow-up Email</option>
                <option>Re-engagement</option>
                <option>Property Match</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={node.config.subject || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, subject: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                placeholder="Enter subject..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Body
              </label>
              <textarea
                rows={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm resize-none"
                placeholder="Hi {{name}},&#10;&#10;Welcome to our service!&#10;&#10;Best regards"
                defaultValue={node.config.body}
              />
              <p className="text-xs text-slate-500 mt-1">Use {'{{name}}'} for personalization</p>
            </div>
          </>
        )}

        {node.type === 'delay' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Wait Duration
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={node.config.duration || 1}
                onChange={(e) =>
                  onUpdate({ config: { ...node.config, duration: parseInt(e.target.value) } })
                }
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                min="1"
              />
              <select
                value={node.config.unit || 'days'}
                onChange={(e) => onUpdate({ config: { ...node.config, unit: e.target.value } })}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Condition Type
              </label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm">
                <option>Email Opened</option>
                <option>Email Clicked</option>
                <option>Lead Score Above</option>
                <option>Has Tag</option>
                <option>Property Viewed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                placeholder="Enter value..."
              />
            </div>
          </>
        )}

        {node.type === 'action' && node.templateId === 'approval_form' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Form Title</label>
              <input
                type="text"
                value={node.config.formTitle || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, formTitle: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                placeholder="Approval required for..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message to Recipient</label>
              <textarea
                rows={4}
                value={node.config.message || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, message: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm resize-none"
                placeholder="Please review and respond to this request..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Approve Button Label</label>
                <input
                  type="text"
                  value={node.config.approveLabel || 'Approve'}
                  onChange={(e) => onUpdate({ config: { ...node.config, approveLabel: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reject Button Label</label>
                <input
                  type="text"
                  value={node.config.rejectLabel || 'Reject'}
                  onChange={(e) => onUpdate({ config: { ...node.config, rejectLabel: e.target.value } })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                />
              </div>
            </div>
          </>
        )}

        {node.type === 'action' && node.templateId === 'create_task' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Task Title</label>
              <input
                type="text"
                value={node.config.title || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, title: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                placeholder="Enter task title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign To
              </label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm">
                <option>Current User</option>
                <option>Team Lead</option>
                <option>Round Robin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </>
        )}

        {/* Performance Stats */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Executed</span>
              <span className="text-sm font-semibold text-slate-900">142 times</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Success Rate</span>
              <span className="text-sm font-semibold text-emerald-600">98.6%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg. Duration</span>
              <span className="text-sm font-semibold text-slate-900">0.8s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 bg-slate-50 sticky bottom-0">
        <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function WorkflowFooter({ nodes }: { nodes: WorkflowNode[] }) {
  return (
    <div className="px-6 py-3 border-t border-slate-200 bg-white rounded-b-2xl">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-6 text-slate-600">
          <span>
            <strong className="text-slate-900">{nodes.length}</strong> blocks
          </span>
          <span>
            <strong className="text-slate-900">
              {nodes.filter((n) => n.type === 'trigger').length}
            </strong>{' '}
            triggers
          </span>
          <span>
            <strong className="text-slate-900">
              {nodes.filter((n) => n.type === 'action').length}
            </strong>{' '}
            actions
          </span>
          <span>
            <strong className="text-slate-900">
              {nodes.filter((n) => n.type === 'condition').length}
            </strong>{' '}
            conditions
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Auto-saved 2 min ago</span>
        </div>
      </div>
    </div>
  );
}