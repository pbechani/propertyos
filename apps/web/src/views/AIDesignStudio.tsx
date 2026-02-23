'use client';

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Bot,
  User,
  Layers,
  Box,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Sparkles,
  Zap,
  Square,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Ruler,
  Home,
  Building2,
  Maximize2,
  RotateCw,
  Lightbulb,
  Shield,
  TrendingDown,
  Plus,
  Save,
  Target,
  Award,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Type definitions
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface FloorPlanElement {
  id: string;
  type: "wall" | "door" | "window" | "room";
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface MaterialSuggestion {
  id: string;
  name: string;
  category: string;
  cost: number;
  sustainability: number;
  compliance: boolean;
  aiRecommended: boolean;
}

interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  status: "compliant" | "warning" | "non-compliant";
  details: string;
}

// Mock data
const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI Design & Legal Assistant. I can help you design floor plans, calculate budgets, ensure compliance, and generate documentation. What would you like to create today?",
    timestamp: new Date(),
    suggestions: [
      "Design a 3-bedroom house",
      "Check building codes",
      "Suggest eco-friendly materials",
      "Calculate construction budget",
    ],
  },
];

const materialSuggestions: MaterialSuggestion[] = [
  {
    id: "M1",
    name: "Structural Steel Grade A36",
    category: "Structural",
    cost: 45000,
    sustainability: 78,
    compliance: true,
    aiRecommended: true,
  },
  {
    id: "M2",
    name: "Concrete Mix C30/37",
    category: "Foundation",
    cost: 28000,
    sustainability: 65,
    compliance: true,
    aiRecommended: true,
  },
  {
    id: "M3",
    name: "Insulated Glass Panels",
    category: "Windows",
    cost: 15600,
    sustainability: 82,
    compliance: true,
    aiRecommended: false,
  },
  {
    id: "M4",
    name: "Bamboo Composite Flooring",
    category: "Flooring",
    cost: 12300,
    sustainability: 95,
    compliance: true,
    aiRecommended: true,
  },
  {
    id: "M5",
    name: "LED Lighting System",
    category: "Electrical",
    cost: 8900,
    sustainability: 90,
    compliance: true,
    aiRecommended: true,
  },
];

const complianceItems: ComplianceItem[] = [
  {
    id: "C1",
    category: "Building Code",
    requirement: "Fire Safety Standards",
    status: "compliant",
    details: "All fire exits and suppression systems meet local codes",
  },
  {
    id: "C2",
    category: "Structural",
    requirement: "Load Bearing Capacity",
    status: "compliant",
    details: "Foundation and structural elements exceed minimum requirements",
  },
  {
    id: "C3",
    category: "Environmental",
    requirement: "Energy Efficiency Rating",
    status: "warning",
    details: "Currently rated B, recommend improvements to achieve A rating",
  },
  {
    id: "C4",
    category: "Accessibility",
    requirement: "ADA Compliance",
    status: "compliant",
    details: "Doorways, ramps, and facilities meet accessibility standards",
  },
  {
    id: "C5",
    category: "Zoning",
    requirement: "Residential Zoning R-1",
    status: "compliant",
    details: "Property use complies with local zoning regulations",
  },
];

const budgetBreakdown = [
  { category: "Foundation", amount: 45000, percentage: 15, variance: 0 },
  { category: "Structure", amount: 90000, percentage: 30, variance: 2000 },
  { category: "Roofing", amount: 30000, percentage: 10, variance: -500 },
  { category: "Windows & Doors", amount: 36000, percentage: 12, variance: 1200 },
  { category: "Electrical", amount: 27000, percentage: 9, variance: 0 },
  { category: "Plumbing", amount: 24000, percentage: 8, variance: 800 },
  { category: "Finishes", amount: 33000, percentage: 11, variance: -300 },
  { category: "HVAC", amount: 15000, percentage: 5, variance: 0 },
];

export default function AIDesignStudio() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [floorPlanElements] = useState<FloorPlanElement[]>([
    {
      id: "room1",
      type: "room",
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      label: "Living Room",
    },
    {
      id: "room2",
      type: "room",
      x: 280,
      y: 50,
      width: 150,
      height: 150,
      label: "Kitchen",
    },
    {
      id: "room3",
      type: "room",
      x: 50,
      y: 230,
      width: 180,
      height: 140,
      label: "Bedroom",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you want to: "${inputMessage}". I've analyzed your request and updated the floor plan with optimized layouts. The design incorporates modern building standards and includes energy-efficient materials. Current compliance status: 95%. Would you like me to generate a detailed BOQ or adjust any specific areas?`,
        timestamp: new Date(),
        suggestions: [
          "Show 3D preview",
          "Generate BOQ",
          "Check compliance",
          "Suggest materials",
        ],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Simulate voice recognition
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setInputMessage("Design a modern 3-bedroom house with open floor plan");
      }, 2000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const calculateTotalCost = () => {
    return budgetBreakdown.reduce((sum, item) => sum + item.amount, 0);
  };

  const getCompliancePercentage = () => {
    const compliant = complianceItems.filter((item) => item.status === "compliant").length;
    return Math.round((compliant / complianceItems.length) * 100);
  };

  const handleExportBOQ = () => {
    alert("BOQ generated successfully! Exporting to your downloads...");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Design Studio</h1>
                <p className="text-xs text-gray-400">Powered by Advanced Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Zap className="w-3 h-3 mr-1" />
                AI Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat Interface */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">AI Assistant</div>
                <div className="text-xs text-gray-400">Design & Legal Expert</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                <Building2 className="w-3 h-3 mr-1" />
                Architecture
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                <Scale className="w-3 h-3 mr-1" />
                Legal
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-gray-700"
                        : "bg-gradient-to-br from-blue-500 to-purple-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600/20 border border-blue-500/30"
                          : "bg-gray-800/50 border border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    {message.suggestions && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-2 py-1 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask anything..."
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleVoiceInput}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                          isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Voice input</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                disabled={isProcessing}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {/* Canvas Toolbar */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "2d" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("2d")}
                className={
                  viewMode === "2d"
                    ? "bg-blue-600 text-white"
                    : "border-gray-700 text-gray-400"
                }
              >
                <Layers className="w-4 h-4 mr-2" />
                2D Floor Plan
              </Button>
              <Button
                variant={viewMode === "3d" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("3d")}
                className={
                  viewMode === "3d"
                    ? "bg-blue-600 text-white"
                    : "border-gray-700 text-gray-400"
                }
              >
                <Box className="w-4 h-4 mr-2" />
                3D Preview
              </Button>
              <Separator orientation="vertical" className="h-6 bg-gray-700 mx-2" />
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-gray-700 ${
                          selectedTool === "wall" ? "bg-gray-700" : ""
                        }`}
                        onClick={() => setSelectedTool("wall")}
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Draw Wall</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-gray-700 ${
                          selectedTool === "door" ? "bg-gray-700" : ""
                        }`}
                        onClick={() => setSelectedTool("door")}
                      >
                        <Home className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Door</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-gray-700 ${
                          selectedTool === "window" ? "bg-gray-700" : ""
                        }`}
                        onClick={() => setSelectedTool("window")}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Window</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700"
                        onClick={() => setShowGrid(!showGrid)}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle Grid</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-700">
                        <Ruler className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Measure</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-gray-700">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700">
                <Redo className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-gray-700 mx-2" />
              <Button variant="outline" size="sm" className="border-gray-700">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400 min-w-12 text-center">
                {zoomLevel}%
              </span>
              <Button variant="outline" size="sm" className="border-gray-700">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            {viewMode === "2d" ? (
              <div
                ref={canvasRef}
                className="absolute inset-0 m-8"
                style={{
                  backgroundImage: showGrid
                    ? "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)"
                    : "none",
                  backgroundSize: "20px 20px",
                }}
              >
                {/* Floor Plan Elements */}
                <svg className="w-full h-full">
                  {floorPlanElements.map((element) => (
                    <g key={element.id}>
                      <rect
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth="2"
                        className="cursor-pointer hover:fill-blue-500/20 transition-colors"
                      />
                      {element.label && (
                        <text
                          x={element.x + element.width / 2}
                          y={element.y + element.height / 2}
                          textAnchor="middle"
                          className="fill-white text-xs font-medium"
                        >
                          {element.label}
                        </text>
                      )}
                      {/* Dimensions */}
                      <text
                        x={element.x + element.width / 2}
                        y={element.y - 5}
                        textAnchor="middle"
                        className="fill-gray-400 text-xs"
                      >
                        {element.width}ft
                      </text>
                      <text
                        x={element.x - 10}
                        y={element.y + element.height / 2}
                        textAnchor="end"
                        className="fill-gray-400 text-xs"
                      >
                        {element.height}ft
                      </text>
                    </g>
                  ))}
                </svg>

                {/* AI Suggestion Overlay */}
                <div className="absolute top-4 left-4 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-lg p-3 max-w-xs">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-blue-300 mb-1">AI Suggestion</div>
                      <div className="text-gray-300">
                        Consider expanding the kitchen by 20% for better workflow. This will
                        increase budget by $4,200.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Indicator */}
                <div className="absolute top-4 right-4 bg-green-600/20 backdrop-blur-md border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-green-300">
                      {getCompliancePercentage()}% Compliant
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* 3D Preview Placeholder */}
                <div className="relative w-full h-full max-w-4xl max-h-3xl m-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-gray-700">
                    {/* Simulated 3D render */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-96 h-64">
                        {/* House outline in 3D perspective */}
                        <svg viewBox="0 0 400 300" className="w-full h-full">
                          {/* Base */}
                          <polygon
                            points="50,200 200,150 350,200 200,250"
                            fill="rgba(59,130,246,0.3)"
                            stroke="rgba(59,130,246,0.8)"
                            strokeWidth="2"
                          />
                          {/* Left wall */}
                          <polygon
                            points="50,200 50,100 200,50 200,150"
                            fill="rgba(59,130,246,0.4)"
                            stroke="rgba(59,130,246,0.8)"
                            strokeWidth="2"
                          />
                          {/* Right wall */}
                          <polygon
                            points="200,150 200,50 350,100 350,200"
                            fill="rgba(59,130,246,0.2)"
                            stroke="rgba(59,130,246,0.8)"
                            strokeWidth="2"
                          />
                          {/* Roof */}
                          <polygon
                            points="50,100 200,30 350,100 200,50"
                            fill="rgba(147,51,234,0.3)"
                            stroke="rgba(147,51,234,0.8)"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-2 border border-gray-700">
                      <div className="flex items-center gap-2 text-sm">
                        <Box className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">3D Render Preview</span>
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                          <RotateCw className="w-3 h-3 mr-1" />
                          Interactive
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Rotate controls */}
                  <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 bg-gray-900/80 backdrop-blur-md"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Budget & Compliance */}
        <div className="w-96 border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <Tabs defaultValue="budget" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 bg-gray-800/50 m-4">
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>

            {/* Budget Tab */}
            <TabsContent value="budget" className="flex-1 px-4 space-y-4">
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Total Budget</div>
                    <div className="text-3xl font-bold text-white">
                      ${calculateTotalCost().toLocaleString()}
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -2.3% under budget
                  </Badge>
                </div>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Budget Breakdown</h3>
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs"
                    onClick={handleExportBOQ}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Generate BOQ
                  </Button>
                </div>
                <div className="space-y-3">
                  {budgetBreakdown.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            ${item.amount.toLocaleString()}
                          </span>
                          {item.variance !== 0 && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                item.variance > 0
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {item.variance > 0 ? "+" : ""}
                              {item.variance}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-blue-600/10 border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-blue-300 mb-1">
                      Real-time Cost Updates
                    </div>
                    <div className="text-gray-300 text-xs">
                      Budget recalculates automatically as you make design changes. AI optimizes
                      for cost efficiency.
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="flex-1 px-4 space-y-4">
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Compliance Score</div>
                    <div className="text-3xl font-bold text-white">
                      {getCompliancePercentage()}%
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Progress value={getCompliancePercentage()} className="h-2" />
              </Card>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Compliance Checklist</h3>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    {complianceItems.filter((i) => i.status === "compliant").length}/
                    {complianceItems.length} Passed
                  </Badge>
                </div>
                <div className="space-y-3">
                  {complianceItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`p-3 ${
                        item.status === "compliant"
                          ? "bg-green-600/10 border-green-500/30"
                          : item.status === "warning"
                          ? "bg-yellow-600/10 border-yellow-500/30"
                          : "bg-red-600/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.status === "compliant"
                              ? "bg-green-500/20"
                              : item.status === "warning"
                              ? "bg-yellow-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          {item.status === "compliant" ? (
                            <CheckCircle
                              className={`w-4 h-4 ${
                                item.status === "compliant"
                                  ? "text-green-400"
                                  : "text-gray-400"
                              }`}
                            />
                          ) : (
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                item.status === "warning"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-1">
                            {item.requirement}
                          </div>
                          <div className="text-xs text-gray-400 mb-1">{item.category}</div>
                          <div className="text-xs text-gray-300">{item.details}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-purple-600/10 border-purple-500/30">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-purple-300 mb-1">
                      Legal Assistant Active
                    </div>
                    <div className="text-gray-300 text-xs">
                      AI continuously monitors local building codes, zoning laws, and regulations
                      to ensure compliance.
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="flex-1 px-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">AI Material Suggestions</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Curated
                </Badge>
              </div>

              <div className="space-y-3">
                {materialSuggestions.map((material) => (
                  <Card
                    key={material.id}
                    className={`p-4 ${
                      material.aiRecommended
                        ? "bg-blue-600/10 border-blue-500/30"
                        : "bg-gray-800/50 border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-white">{material.name}</h4>
                          {material.aiRecommended && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              AI Pick
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{material.category}</div>
                      </div>
                      {material.compliance && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Cost</span>
                        <span className="font-semibold text-white">
                          ${material.cost.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Sustainability</span>
                          <span className="text-green-400">{material.sustainability}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              material.sustainability >= 80
                                ? "bg-green-500"
                                : material.sustainability >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${material.sustainability}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add to Design
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose what you'd like to export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start border-gray-700 hover:bg-gray-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              Floor Plan (PDF)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-700 hover:bg-gray-800"
            >
              <Box className="w-4 h-4 mr-2" />
              3D Model (OBJ)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-700 hover:bg-gray-800"
              onClick={handleExportBOQ}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Bill of Quantities (Excel)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-700 hover:bg-gray-800"
            >
              <Shield className="w-4 h-4 mr-2" />
              Compliance Report (PDF)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-gray-700 hover:bg-gray-800"
            >
              <Scale className="w-4 h-4 mr-2" />
              Legal Documentation (ZIP)
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowExportDialog(false);
                alert("Export started! Files will be ready in your downloads.");
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Export All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
