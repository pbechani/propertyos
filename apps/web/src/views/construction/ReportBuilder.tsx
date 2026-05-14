'use client';

import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Table as TableIcon,
  FileText,
  TrendingUp,
  Layout,
  Trash2,
  Settings,
  Download,
  Eye,
  Plus,
  GripVertical,
  CheckCircle,
  ClipboardList,
  FileSpreadsheet,
  FileImage,
  Edit,
  Copy
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Widget types
const WIDGET_TYPES = {
  METRIC: 'metric',
  CHART: 'chart',
  TABLE: 'table',
  TEXT: 'text',
  DIVIDER: 'divider'
};

// Available widgets
const AVAILABLE_WIDGETS = [
  {
    id: 'metric',
    type: WIDGET_TYPES.METRIC,
    name: 'Metric Widget',
    icon: TrendingUp,
    description: 'Display key performance metrics'
  },
  {
    id: 'bar-chart',
    type: WIDGET_TYPES.CHART,
    name: 'Bar Chart',
    icon: BarChart3,
    chartType: 'bar',
    description: 'Compare values across categories'
  },
  {
    id: 'line-chart',
    type: WIDGET_TYPES.CHART,
    name: 'Line Chart',
    icon: LineChartIcon,
    chartType: 'line',
    description: 'Show trends over time'
  },
  {
    id: 'pie-chart',
    type: WIDGET_TYPES.CHART,
    name: 'Pie Chart',
    icon: PieChart,
    chartType: 'pie',
    description: 'Display proportions'
  },
  {
    id: 'area-chart',
    type: WIDGET_TYPES.CHART,
    name: 'Area Chart',
    icon: LineChartIcon,
    chartType: 'area',
    description: 'Visualize cumulative trends'
  },
  {
    id: 'table',
    type: WIDGET_TYPES.TABLE,
    name: 'Data Table',
    icon: TableIcon,
    description: 'Display tabular data'
  },
  {
    id: 'text',
    type: WIDGET_TYPES.TEXT,
    name: 'Text Block',
    icon: FileText,
    description: 'Add headers and descriptions'
  },
  {
    id: 'divider',
    type: WIDGET_TYPES.DIVIDER,
    name: 'Divider',
    icon: Layout,
    description: 'Visual separator'
  }
];

// Sample data sources
const DATA_SOURCES = {
  projectCosts: [
    { name: 'Jan', value: 4500000 },
    { name: 'Feb', value: 5200000 },
    { name: 'Mar', value: 4800000 },
    { name: 'Apr', value: 6100000 },
    { name: 'May', value: 5800000 },
    { name: 'Jun', value: 6500000 }
  ],
  budgetByPhase: [
    { name: 'Foundation', value: 2500000, color: '#3b82f6' },
    { name: 'Structure', value: 4200000, color: '#8b5cf6' },
    { name: 'MEP', value: 3100000, color: '#10b981' },
    { name: 'Finishes', value: 2800000, color: '#f59e0b' },
    { name: 'Sitework', value: 1400000, color: '#ef4444' }
  ],
  projectStatus: [
    { name: 'Active', value: 12, color: '#10b981' },
    { name: 'Planning', value: 5, color: '#3b82f6' },
    { name: 'On Hold', value: 2, color: '#f59e0b' },
    { name: 'Completed', value: 18, color: '#6b7280' }
  ],
  contractors: [
    { id: 1, name: 'ABC Construction', projects: 5, rating: 4.8, status: 'Active' },
    { id: 2, name: 'BuildRight Inc', projects: 3, rating: 4.6, status: 'Active' },
    { id: 3, name: 'Metro Builders', projects: 4, rating: 4.9, status: 'Active' },
    { id: 4, name: 'Elite Construction', projects: 2, rating: 4.7, status: 'Active' }
  ]
};

// Draggable widget from sidebar
function DraggableWidget({ widget }: { widget: any }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'widget',
    item: { widget },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  const Icon = widget.icon;

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`p-4 bg-white border-2 border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">{widget.name}</p>
          <p className="text-xs text-gray-500">{widget.description}</p>
        </div>
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// Drop zone for canvas
function DropZone({ onDrop, children }: { onDrop: (widget: any) => void; children: React.ReactNode }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'widget',
    drop: (item: { widget: any }) => onDrop(item.widget),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[600px] p-6 bg-gray-50 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
    >
      {children}
    </div>
  );
}

export function ReportBuilder() {
  const [reportWidgets, setReportWidgets] = useState<any[]>([]);
  const [reportName, setReportName] = useState('Untitled Report');
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('widgets');

  const handleWidgetDrop = (widget: any) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      ...widget,
      config: getDefaultConfig(widget.type, widget.chartType)
    };
    setReportWidgets([...reportWidgets, newWidget]);
  };

  const getDefaultConfig = (type: string, chartType?: string) => {
    switch (type) {
      case WIDGET_TYPES.METRIC:
        return {
          title: 'Metric Title',
          value: '0',
          icon: 'dollar',
          color: 'blue',
          trend: '+0%',
          trendDirection: 'up'
        };
      case WIDGET_TYPES.CHART:
        return {
          title: 'Chart Title',
          dataSource: 'projectCosts',
          chartType: chartType || 'bar',
          showLegend: true,
          showGrid: true
        };
      case WIDGET_TYPES.TABLE:
        return {
          title: 'Table Title',
          dataSource: 'contractors',
          columns: ['name', 'projects', 'rating', 'status']
        };
      case WIDGET_TYPES.TEXT:
        return {
          content: 'Enter your text here...',
          size: 'medium',
          align: 'left'
        };
      default:
        return {};
    }
  };

  const handleRemoveWidget = (id: string) => {
    setReportWidgets(reportWidgets.filter(w => w.id !== id));
    if (selectedWidget?.id === id) {
      setSelectedWidget(null);
    }
  };

  const handleDuplicateWidget = (widget: any) => {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}`
    };
    setReportWidgets([...reportWidgets, newWidget]);
  };

  const handleUpdateWidget = (id: string, config: any) => {
    setReportWidgets(reportWidgets.map(w => 
      w.id === id ? { ...w, config: { ...w.config, ...config } } : w
    ));
  };

  const renderWidget = (widget: any, _isPreview = false) => {
    switch (widget.type) {
      case WIDGET_TYPES.METRIC:
        return <MetricWidget config={widget.config} />;
      case WIDGET_TYPES.CHART:
        return <ChartWidget config={widget.config} />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget config={widget.config} />;
      case WIDGET_TYPES.TEXT:
        return <TextWidget config={widget.config} />;
      case WIDGET_TYPES.DIVIDER:
        return <div className="border-t-2 border-gray-300 my-4" />;
      default:
        return null;
    }
  };

  const handleExport = (format: string) => {
    console.log(`Exporting report as ${format}`);
    // In a real app, implement actual export logic
    setShowExportDialog(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="text-2xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
            <p className="text-gray-500 mt-1">Build custom reports with drag-and-drop widgets</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Widget Library */}
          <div className="col-span-3">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Widget Library</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="widgets">Widgets</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="widgets" className="space-y-3 mt-4">
                    {AVAILABLE_WIDGETS.map((widget) => (
                      <DraggableWidget key={widget.id} widget={widget} />
                    ))}
                  </TabsContent>
                  <TabsContent value="data" className="mt-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Project Costs</p>
                        <p className="text-xs text-gray-500">Monthly cost data</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Budget by Phase</p>
                        <p className="text-xs text-gray-500">Phase breakdown</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Project Status</p>
                        <p className="text-xs text-gray-500">Status distribution</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Contractors</p>
                        <p className="text-xs text-gray-500">Contractor list</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Center - Report Canvas */}
          <div className="col-span-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Report Canvas
                  <Badge variant="secondary">{reportWidgets.length} widgets</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DropZone onDrop={handleWidgetDrop}>
                  {reportWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drag widgets here to build your report
                      </p>
                      <p className="text-sm text-gray-500">
                        Choose from metrics, charts, tables, and more
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reportWidgets.map((widget, index) => (
                        <div
                          key={widget.id}
                          className={`bg-white rounded-lg border-2 transition-all ${
                            selectedWidget?.id === widget.id
                              ? 'border-blue-400 shadow-lg'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between p-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                              <span className="text-sm font-medium text-gray-700">
                                Widget {index + 1}: {widget.name}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedWidget(widget)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicateWidget(widget)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveWidget(widget.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            {renderWidget(widget)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DropZone>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Configuration */}
          <div className="col-span-3">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedWidget ? (
                  <WidgetConfigurator
                    widget={selectedWidget}
                    onUpdate={(config) => handleUpdateWidget(selectedWidget.id, config)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Settings className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Select a widget to configure its settings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{reportName} - Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-white">
              {reportWidgets.map((widget) => (
                <div key={widget.id}>{renderWidget(widget, true)}</div>
              ))}
              {reportWidgets.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No widgets added to report
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleExport('pdf')}
                >
                  <FileText className="w-8 h-8 text-red-600" />
                  <span>PDF Document</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleExport('excel')}
                >
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <span>Excel Workbook</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleExport('png')}
                >
                  <FileImage className="w-8 h-8 text-blue-600" />
                  <span>PNG Image</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleExport('csv')}
                >
                  <ClipboardList className="w-8 h-8 text-purple-600" />
                  <span>CSV Data</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}

// Widget Configurator Component
function WidgetConfigurator({ widget, onUpdate }: { widget: any; onUpdate: (config: any) => void }) {
  const config = widget.config || {};

  if (widget.type === WIDGET_TYPES.METRIC) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Metric Title</Label>
          <Input
            value={config.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        <div>
          <Label>Value</Label>
          <Input
            value={config.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        </div>
        <div>
          <Label>Trend</Label>
          <Input
            value={config.trend || ''}
            onChange={(e) => onUpdate({ trend: e.target.value })}
          />
        </div>
        <div>
          <Label>Color</Label>
          <Select value={config.color} onValueChange={(value) => onUpdate({ color: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (widget.type === WIDGET_TYPES.CHART) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Chart Title</Label>
          <Input
            value={config.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        <div>
          <Label>Data Source</Label>
          <Select value={config.dataSource} onValueChange={(value) => onUpdate({ dataSource: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="projectCosts">Project Costs</SelectItem>
              <SelectItem value="budgetByPhase">Budget by Phase</SelectItem>
              <SelectItem value="projectStatus">Project Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Chart Type</Label>
          <Select value={config.chartType} onValueChange={(value) => onUpdate({ chartType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showLegend"
            checked={config.showLegend}
            onChange={(e) => onUpdate({ showLegend: e.target.checked })}
          />
          <Label htmlFor="showLegend">Show Legend</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showGrid"
            checked={config.showGrid}
            onChange={(e) => onUpdate({ showGrid: e.target.checked })}
          />
          <Label htmlFor="showGrid">Show Grid</Label>
        </div>
      </div>
    );
  }

  if (widget.type === WIDGET_TYPES.TABLE) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Table Title</Label>
          <Input
            value={config.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>
        <div>
          <Label>Data Source</Label>
          <Select value={config.dataSource} onValueChange={(value) => onUpdate({ dataSource: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contractors">Contractors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (widget.type === WIDGET_TYPES.TEXT) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Text Content</Label>
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            value={config.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
          />
        </div>
        <div>
          <Label>Size</Label>
          <Select value={config.size} onValueChange={(value) => onUpdate({ size: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return null;
}

// Metric Widget Component
function MetricWidget({ config }: { config: any }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-2">{config.title}</p>
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold text-gray-900">{config.value}</p>
        {config.trend && (
          <Badge className={colorClasses[config.color as keyof typeof colorClasses] || colorClasses.blue}>
            {config.trend}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Chart Widget Component
function ChartWidget({ config }: { config: any }) {
  const data = DATA_SOURCES[config.dataSource as keyof typeof DATA_SOURCES] || DATA_SOURCES.projectCosts;

  const renderChart = () => {
    switch (config.chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.showLegend && <Legend />}
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {config.showLegend && <Legend />}
            <Area type="monotone" dataKey="value" fill="#3b82f6" stroke="#3b82f6" />
          </AreaChart>
        );
      case 'pie':
        return (
          <RechartsPie>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
              ))}
            </Pie>
            <Tooltip />
            {config.showLegend && <Legend />}
          </RechartsPie>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart() ?? <></>}
      </ResponsiveContainer>
    </div>
  );
}

// Table Widget Component
function TableWidget({ config }: { config: any }) {
  const data = DATA_SOURCES[config.dataSource as keyof typeof DATA_SOURCES] || [];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {config.columns.map((col: string) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.isArray(data) && data.map((row: any, idx: number) => (
              <tr key={idx}>
                {config.columns.map((col: string) => (
                  <td key={col} className="px-4 py-3 text-sm text-gray-900">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Text Widget Component
function TextWidget({ config }: { config: any }) {
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={sizeClasses[config.size as keyof typeof sizeClasses] || sizeClasses.medium}>
      {config.content}
    </div>
  );
}