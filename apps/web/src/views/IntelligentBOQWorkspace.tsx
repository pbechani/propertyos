'use client';

import { useState } from "react";
import {
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  History,
  FileText,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  Lightbulb,
  DollarSign,
  Package,
  Target,
  BarChart3,
  ChevronDown,
  Check,
  ExternalLink,
  Info,
  Zap,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// BOQ Item interface
interface BOQItem {
  id: string;
  category: string;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  total: number;
  supplier?: string;
  notes?: string;
}

// Mock BOQ data
const initialBOQItems: BOQItem[] = [
  {
    id: "1",
    category: "Foundation",
    item: "Concrete Grade 30",
    description: "High-strength concrete for foundation",
    unit: "m³",
    quantity: 45,
    unitCost: 125.00,
    total: 5625.00,
    supplier: "BuildMart Supplies",
  },
  {
    id: "2",
    category: "Foundation",
    item: "Steel Reinforcement Bar",
    description: "12mm diameter rebar",
    unit: "tonne",
    quantity: 3.5,
    unitCost: 850.00,
    total: 2975.00,
    supplier: "SteelCo Ltd",
  },
  {
    id: "3",
    category: "Masonry",
    item: "Common Bricks",
    description: "Standard clay bricks",
    unit: "1000",
    quantity: 25,
    unitCost: 420.00,
    total: 10500.00,
    supplier: "BuildMart Supplies",
  },
  {
    id: "4",
    category: "Masonry",
    item: "Cement Mortar",
    description: "Pre-mixed mortar",
    unit: "tonne",
    quantity: 2.8,
    unitCost: 95.00,
    total: 266.00,
    supplier: "BuildMart Supplies",
  },
  {
    id: "5",
    category: "Roofing",
    item: "Roof Tiles - Clay",
    description: "Premium clay roof tiles",
    unit: "m²",
    quantity: 180,
    unitCost: 42.50,
    total: 7650.00,
    supplier: "RoofMasters",
  },
  {
    id: "6",
    category: "Roofing",
    item: "Timber Trusses",
    description: "Pre-fabricated roof trusses",
    unit: "unit",
    quantity: 18,
    unitCost: 385.00,
    total: 6930.00,
    supplier: "TimberWorks",
  },
  {
    id: "7",
    category: "Electrical",
    item: "Electrical Wiring",
    description: "2.5mm² copper cable",
    unit: "metre",
    quantity: 450,
    unitCost: 2.85,
    total: 1282.50,
    supplier: "ElectroPro",
  },
  {
    id: "8",
    category: "Plumbing",
    item: "PVC Pipes 110mm",
    description: "Drainage pipes",
    unit: "metre",
    quantity: 85,
    unitCost: 12.50,
    total: 1062.50,
    supplier: "PlumbSupply",
  },
];

// Supplier alternatives
const supplierAlternatives = [
  {
    itemId: "1",
    item: "Concrete Grade 30",
    currentSupplier: "BuildMart Supplies",
    currentPrice: 125.00,
    alternatives: [
      { supplier: "ConcreteDirect", price: 118.00, savings: 7.00, rating: 4.8, deliveryTime: "Next Day" },
      { supplier: "MixMasters", price: 122.00, savings: 3.00, rating: 4.6, deliveryTime: "2-3 Days" },
      { supplier: "FoundationPro", price: 128.00, savings: -3.00, rating: 4.9, deliveryTime: "Same Day" },
    ],
  },
  {
    itemId: "3",
    item: "Common Bricks",
    currentSupplier: "BuildMart Supplies",
    currentPrice: 420.00,
    alternatives: [
      { supplier: "BrickWarehouse", price: 395.00, savings: 25.00, rating: 4.7, deliveryTime: "3-5 Days" },
      { supplier: "MasonrySupplies", price: 410.00, savings: 10.00, rating: 4.5, deliveryTime: "2-3 Days" },
    ],
  },
  {
    itemId: "5",
    item: "Roof Tiles - Clay",
    currentSupplier: "RoofMasters",
    currentPrice: 42.50,
    alternatives: [
      { supplier: "TilePro", price: 39.50, savings: 3.00, rating: 4.6, deliveryTime: "5-7 Days" },
      { supplier: "PremiumRoofing", price: 44.00, savings: -1.50, rating: 4.9, deliveryTime: "Next Day" },
    ],
  },
];

// Material swap suggestions
const materialSwaps = [
  {
    originalItem: "Roof Tiles - Clay",
    category: "Roofing",
    suggestion: "Concrete Roof Tiles",
    reason: "Cost Optimization",
    currentCost: 7650.00,
    newCost: 5940.00,
    savings: 1710.00,
    savingsPercent: 22.4,
    pros: ["Lower cost", "Faster installation", "Good durability"],
    cons: ["Slightly heavier", "Less premium appearance"],
    impactOnBudget: "positive",
  },
  {
    originalItem: "Timber Trusses",
    category: "Roofing",
    suggestion: "Steel Trusses",
    reason: "Durability Enhancement",
    currentCost: 6930.00,
    newCost: 8470.00,
    savings: -1540.00,
    savingsPercent: -22.2,
    pros: ["Superior strength", "Fire resistant", "Longer lifespan"],
    cons: ["Higher initial cost", "Requires specialist installation"],
    impactOnBudget: "negative",
  },
  {
    originalItem: "Common Bricks",
    category: "Masonry",
    suggestion: "Engineering Bricks",
    reason: "Quality Upgrade",
    currentCost: 10500.00,
    newCost: 11250.00,
    savings: -750.00,
    savingsPercent: -7.1,
    pros: ["Higher strength", "Better water resistance", "Premium finish"],
    cons: ["Increased cost", "Limited color options"],
    impactOnBudget: "negative",
  },
];

// Version history
const versionHistory = [
  {
    id: "v6",
    name: "Current - Cost Optimization v2",
    date: "2026-02-22 14:30",
    author: "Sarah Chen",
    totalCost: 36291.00,
    itemCount: 8,
    changes: "Applied supplier alternatives for concrete and bricks",
    isCurrent: true,
  },
  {
    id: "v5",
    name: "Cost Optimization v1",
    date: "2026-02-22 11:15",
    author: "Sarah Chen",
    totalCost: 37850.00,
    itemCount: 8,
    changes: "Optimized electrical and plumbing costs",
  },
  {
    id: "v4",
    name: "Client Revision",
    date: "2026-02-20 16:45",
    author: "Marcus Sterling",
    totalCost: 39200.00,
    itemCount: 9,
    changes: "Added client-requested premium fixtures",
  },
  {
    id: "v3",
    name: "Initial Draft v3",
    date: "2026-02-18 10:20",
    author: "Sarah Chen",
    totalCost: 35600.00,
    itemCount: 7,
    changes: "Adjusted quantities based on site measurements",
  },
  {
    id: "v2",
    name: "Initial Draft v2",
    date: "2026-02-15 14:00",
    author: "Sarah Chen",
    totalCost: 34200.00,
    itemCount: 7,
    changes: "Updated unit costs from suppliers",
  },
];

export default function IntelligentBOQWorkspace() {
  const [boqItems, setBoqItems] = useState<BOQItem[]>(initialBOQItems);
  const [selectedItem, setSelectedItem] = useState<BOQItem | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [, setShowCompareVersions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setShowSupplierComparison] = useState<(typeof supplierAlternatives)[number] | null>(null);
  const [showMaterialSwap, setShowMaterialSwap] = useState<(typeof materialSwaps)[number] | null>(null);
  const [projectBudget] = useState(45000.00);

  // Calculate totals
  const totalCost = boqItems.reduce((sum, item) => sum + item.total, 0);
  const budgetUsage = (totalCost / projectBudget) * 100;
  const budgetRemaining = projectBudget - totalCost;

  // Get categories
  const categories = Array.from(new Set(boqItems.map((item) => item.category)));

  // Filter items
  const filteredItems = boqItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group items by category
  const groupedItems = categories.map((category) => ({
    category,
    items: filteredItems.filter((item) => item.category === category),
    total: filteredItems
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.total, 0),
  }));

  const handleCellEdit = (id: string, field: string, value: string | number) => {
    setBoqItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total
          if (field === "quantity" || field === "unitCost") {
            updatedItem.total = updatedItem.quantity * updatedItem.unitCost;
          }
          return updatedItem;
        }
        return item;
      })
    );
    setEditingCell(null);
  };

  const handleAddItem = () => {
    const newItem: BOQItem = {
      id: `new-${Date.now()}`,
      category: categories[0] || "General",
      item: "New Item",
      description: "",
      unit: "unit",
      quantity: 1,
      unitCost: 0,
      total: 0,
    };
    setBoqItems([...boqItems, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setBoqItems(boqItems.filter((item) => item.id !== id));
  };

  const handleDuplicateItem = (item: BOQItem) => {
    const newItem = { ...item, id: `dup-${Date.now()}` };
    setBoqItems([...boqItems, newItem]);
  };

  const getBudgetStatus = () => {
    if (budgetUsage <= 85) return { color: "text-green-600", bg: "bg-green-100", label: "On Track" };
    if (budgetUsage <= 100) return { color: "text-yellow-600", bg: "bg-yellow-100", label: "Near Limit" };
    return { color: "text-red-600", bg: "bg-red-100", label: "Over Budget" };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Bill of Quantities</h1>
              <p className="text-sm text-gray-600">Luxury Apartment Complex - Phase 1</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Version History */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-300">
                    <History className="w-4 h-4 mr-2" />
                    Version History
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {versionHistory.map((version) => (
                    <DropdownMenuItem key={version.id} className="flex-col items-start p-3">
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="font-semibold flex items-center gap-2">
                          {version.name}
                          {version.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{version.date}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{version.author}</div>
                      <div className="text-xs text-gray-500">{version.changes}</div>
                      <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs">£{version.totalCost.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{version.itemCount} items</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowCompareVersions(true)}>
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Compare Versions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Package className="w-4 h-4 mr-2" />
                    Export with Supplier Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="border-gray-300">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>

              <Button className="bg-black text-white hover:bg-gray-800">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-gray-300">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleAddItem} className="border-gray-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content - Spreadsheet */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-black">£{totalCost.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{boqItems.length} items</div>
              </Card>

              <Card className="p-4 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Budget</span>
                  <Target className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-black">£{projectBudget.toLocaleString()}</div>
                <div className={`text-xs mt-1 ${budgetStatus.color}`}>
                  {budgetRemaining >= 0 ? "£" + budgetRemaining.toLocaleString() + " remaining" : "£" + Math.abs(budgetRemaining).toLocaleString() + " over"}
                </div>
              </Card>

              <Card className="p-4 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Budget Usage</span>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-black">{budgetUsage.toFixed(1)}%</div>
                <Progress value={budgetUsage} className="h-2 mt-2" />
              </Card>

              <Card className={`p-4 border-gray-200 ${budgetStatus.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Status</span>
                  {budgetUsage <= 100 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className={`text-2xl font-bold ${budgetStatus.color}`}>{budgetStatus.label}</div>
              </Card>
            </div>

            {/* BOQ Table */}
            <Card className="border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 w-8">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 w-32">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 min-w-48">Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 min-w-64">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 w-24">Unit</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 w-28">Quantity</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 w-32">Unit Cost</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 w-32">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 w-32">Supplier</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedItems.flatMap((group) => [
                      // Category Header Row
                      <tr key={`cat-${group.category}`} className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={7} className="py-2 px-4">
                          <span className="font-semibold text-sm">{group.category}</span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span className="font-semibold text-sm">£{group.total.toLocaleString()}</span>
                        </td>
                        <td colSpan={2}></td>
                      </tr>,
                      // Items
                      ...group.items.map((item, index) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedItem(item)}
                          >
                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {editingCell?.id === item.id && editingCell?.field === "item" ? (
                                <Input
                                  value={item.item}
                                  onChange={(e) => handleCellEdit(item.id, "item", e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="h-8 text-sm border-gray-300"
                                />
                              ) : (
                                <div
                                  className="font-medium text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ id: item.id, field: "item" });
                                  }}
                                >
                                  {item.item}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {editingCell?.id === item.id && editingCell?.field === "description" ? (
                                <Input
                                  value={item.description}
                                  onChange={(e) => handleCellEdit(item.id, "description", e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="h-8 text-sm border-gray-300"
                                />
                              ) : (
                                <div
                                  className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ id: item.id, field: "description" });
                                  }}
                                >
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {editingCell?.id === item.id && editingCell?.field === "unit" ? (
                                <Input
                                  value={item.unit}
                                  onChange={(e) => handleCellEdit(item.id, "unit", e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="h-8 text-sm border-gray-300"
                                />
                              ) : (
                                <div
                                  className="text-sm cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ id: item.id, field: "unit" });
                                  }}
                                >
                                  {item.unit}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {editingCell?.id === item.id && editingCell?.field === "quantity" ? (
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleCellEdit(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="h-8 text-sm text-right border-gray-300"
                                />
                              ) : (
                                <div
                                  className="text-sm font-medium cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ id: item.id, field: "quantity" });
                                  }}
                                >
                                  {item.quantity.toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {editingCell?.id === item.id && editingCell?.field === "unitCost" ? (
                                <Input
                                  type="number"
                                  value={item.unitCost}
                                  onChange={(e) => handleCellEdit(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="h-8 text-sm text-right border-gray-300"
                                />
                              ) : (
                                <div
                                  className="text-sm font-medium cursor-pointer hover:bg-gray-100 p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCell({ id: item.id, field: "unitCost" });
                                  }}
                                >
                                  £{item.unitCost.toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm font-bold">£{item.total.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-gray-600">{item.supplier}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDuplicateItem(item);
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Duplicate</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteItem(item.id);
                                        }}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                          </tr>
                        ))
                    ])}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={7} className="py-4 px-4 text-right">
                        <span className="text-lg font-bold">Grand Total:</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-xl font-bold text-black">£{totalCost.toLocaleString()}</span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Budget Alignment Gauge */}
            <Card className="p-6 border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Budget Alignment
                </h3>
                <Badge className={budgetStatus.bg + " " + budgetStatus.color}>{budgetStatus.label}</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Current Spend</span>
                    <span className="font-semibold">£{totalCost.toLocaleString()}</span>
                  </div>
                  <Progress value={budgetUsage} className="h-3" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">0%</span>
                    <span className="text-xs font-semibold">{budgetUsage.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500">100%</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Project Budget</span>
                    <span className="font-semibold">£{projectBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Cost</span>
                    <span className="font-semibold">£{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold">
                      {budgetRemaining >= 0 ? "Remaining" : "Over Budget"}
                    </span>
                    <span className={`font-bold ${budgetRemaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {budgetRemaining >= 0 ? "£" : "-£"}
                      {Math.abs(budgetRemaining).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Material Swap Suggestions */}
            <Card className="p-6 border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Smart Suggestions
                </h3>
                <Badge variant="secondary">{materialSwaps.length}</Badge>
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-3 pr-4">
                  {materialSwaps.map((swap, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setShowMaterialSwap(swap)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">{swap.suggestion}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            Replace: {swap.originalItem}
                          </div>
                        </div>
                        {swap.impactOnBudget === "positive" ? (
                          <TrendingDown className="w-5 h-5 text-green-600 shrink-0" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-yellow-600 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className={
                            swap.impactOnBudget === "positive"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {swap.reason}
                        </Badge>
                        <span
                          className={`text-sm font-bold ${
                            swap.savings > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {swap.savings > 0 ? "Save " : ""}
                          £{Math.abs(swap.savings).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Current: £{swap.currentCost.toLocaleString()}</span>
                        <span>New: £{swap.newCost.toLocaleString()}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-gray-300 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMaterialSwap(swap);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Supplier Price Comparison */}
            {selectedItem && supplierAlternatives.find((alt) => alt.itemId === selectedItem.id) && (
              <Card className="p-6 border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Supplier Alternatives
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowSupplierComparison(
                        supplierAlternatives.find((alt) => alt.itemId === selectedItem.id) ?? null
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Selected Item:</div>
                  <div className="font-semibold">{selectedItem.item}</div>
                </div>

                <div className="space-y-3">
                  {supplierAlternatives
                    .find((alt) => alt.itemId === selectedItem.id)
                    ?.alternatives.map((alt, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{alt.supplier}</div>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.floor(alt.rating) ? "bg-yellow-400" : "bg-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-600 ml-1">{alt.rating}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">£{alt.price.toFixed(2)}</div>
                            {alt.savings !== 0 && (
                              <div
                                className={`text-xs font-semibold ${
                                  alt.savings > 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {alt.savings > 0 ? "Save" : "+"} £{Math.abs(alt.savings).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">Delivery: {alt.deliveryTime}</div>
                        {alt.savings > 0 && (
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Switch Supplier
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6 border-gray-200 bg-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Supplier Prices
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <Target className="w-4 h-4 mr-2" />
                  Optimize for Budget
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <Settings className="w-4 h-4 mr-2" />
                  BOQ Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Material Swap Detail Modal */}
      {showMaterialSwap && (
        <Dialog open={!!showMaterialSwap} onOpenChange={() => setShowMaterialSwap(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Material Swap Analysis</DialogTitle>
              <DialogDescription>
                Detailed comparison between {showMaterialSwap.originalItem} and {showMaterialSwap.suggestion}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Cost Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Current Material</div>
                  <div className="font-semibold mb-2">{showMaterialSwap.originalItem}</div>
                  <div className="text-2xl font-bold">£{showMaterialSwap.currentCost.toLocaleString()}</div>
                </div>
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Suggested Material</div>
                  <div className="font-semibold mb-2">{showMaterialSwap.suggestion}</div>
                  <div className="text-2xl font-bold text-green-600">£{showMaterialSwap.newCost.toLocaleString()}</div>
                </div>
              </div>

              {/* Savings */}
              <Card className={`p-4 ${showMaterialSwap.savings > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {showMaterialSwap.savings > 0 ? "Total Savings" : "Additional Cost"}
                    </div>
                    <div className={`text-3xl font-bold ${showMaterialSwap.savings > 0 ? "text-green-600" : "text-red-600"}`}>
                      {showMaterialSwap.savings > 0 ? "-" : "+"}£{Math.abs(showMaterialSwap.savings).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Percentage</div>
                    <div className={`text-2xl font-bold ${showMaterialSwap.savings > 0 ? "text-green-600" : "text-red-600"}`}>
                      {showMaterialSwap.savings > 0 ? "-" : "+"}
                      {Math.abs(showMaterialSwap.savingsPercent).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pros and Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Advantages
                  </h4>
                  <ul className="space-y-2">
                    {showMaterialSwap.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Considerations
                  </h4>
                  <ul className="space-y-2">
                    {showMaterialSwap.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Apply This Change
                </Button>
                <Button variant="outline" className="flex-1 border-gray-300">
                  Request More Info
                </Button>
                <Button variant="outline" onClick={() => setShowMaterialSwap(null)} className="border-gray-300">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}