import { useState } from "react";
import {
  Shield,
  Star,
  Award,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Send,
  Eye,
  ThumbsUp,
  Briefcase,
  Users,
  Target,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  Truck,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Download,
  MessageSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import { ScrollArea } from "../components/ui/scroll-area";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// Mock data for contractors
const contractors = [
  {
    id: 1,
    name: "BuildRight Construction",
    specialty: "General Contractor",
    location: "London, UK",
    rating: 4.9,
    reviews: 127,
    completedProjects: 243,
    riskScore: 95,
    certifications: ["ISO 9001", "Safe Contractor", "CHAS", "Constructionline"],
    skills: ["Commercial Build", "Residential", "Renovations", "Project Management"],
    avatar: "construction worker site",
    responseTime: "2-4 hours",
    insuranceCoverage: "£10M",
    yearsExperience: 15,
    verified: true,
    portfolio: [
      { id: 1, title: "Luxury Apartment Complex", image: "luxury apartment building" },
      { id: 2, title: "Commercial Office Fit-Out", image: "modern office interior" },
      { id: 3, title: "Heritage Restoration", image: "historic building restoration" },
      { id: 4, title: "Retail Space Development", image: "retail store construction" },
    ],
    recentReviews: [
      { author: "Sarah Chen", rating: 5, text: "Exceptional work quality and professionalism", date: "2 weeks ago" },
      { author: "David Morrison", rating: 5, text: "Completed ahead of schedule with no issues", date: "1 month ago" },
    ],
    performanceMetrics: {
      onTimeCompletion: 96,
      budgetAdherence: 94,
      clientSatisfaction: 98,
      safetyRecord: 100,
    },
  },
  {
    id: 2,
    name: "Premier Electrical Solutions",
    specialty: "Electrical Contractor",
    location: "Manchester, UK",
    rating: 4.8,
    reviews: 89,
    completedProjects: 176,
    riskScore: 92,
    certifications: ["NICEIC", "ECA", "Part P", "18th Edition"],
    skills: ["Commercial Wiring", "Smart Home", "Solar Installation", "Emergency Services"],
    avatar: "electrician working",
    responseTime: "1-2 hours",
    insuranceCoverage: "£5M",
    yearsExperience: 12,
    verified: true,
    portfolio: [
      { id: 1, title: "Smart Office System", image: "modern office technology" },
      { id: 2, title: "Residential Solar Array", image: "solar panels installation" },
      { id: 3, title: "Industrial Rewiring", image: "industrial electrical work" },
    ],
    recentReviews: [
      { author: "Michael Brown", rating: 5, text: "Excellent electrical work and very professional", date: "1 week ago" },
    ],
    performanceMetrics: {
      onTimeCompletion: 95,
      budgetAdherence: 97,
      clientSatisfaction: 96,
      safetyRecord: 100,
    },
  },
  {
    id: 3,
    name: "Elite Plumbing & Heating",
    specialty: "Plumbing & HVAC",
    location: "Birmingham, UK",
    rating: 4.7,
    reviews: 104,
    completedProjects: 198,
    riskScore: 90,
    certifications: ["Gas Safe", "OFTEC", "CIPHE", "BPEC"],
    skills: ["Heating Systems", "Bathroom Fitting", "Drainage", "Boiler Installation"],
    avatar: "plumber working",
    responseTime: "3-5 hours",
    insuranceCoverage: "£7M",
    yearsExperience: 10,
    verified: true,
    portfolio: [
      { id: 1, title: "Luxury Bathroom Suite", image: "modern bathroom design" },
      { id: 2, title: "Commercial HVAC System", image: "commercial hvac installation" },
    ],
    recentReviews: [
      { author: "Emma Wilson", rating: 5, text: "High quality work and fair pricing", date: "3 weeks ago" },
    ],
    performanceMetrics: {
      onTimeCompletion: 93,
      budgetAdherence: 95,
      clientSatisfaction: 94,
      safetyRecord: 98,
    },
  },
];

// Mock data for suppliers
const suppliers = [
  {
    id: 1,
    name: "BuildMart Supplies",
    category: "Building Materials",
    location: "National Distribution",
    rating: 4.8,
    reviews: 342,
    verified: true,
    products: [
      {
        id: 101,
        name: "Premium Cement 50kg",
        price: 8.99,
        unit: "bag",
        stock: "In Stock",
        stockLevel: 500,
        minOrder: 10,
        image: "cement bags",
        delivery: "Next Day",
      },
      {
        id: 102,
        name: "Steel Rebar 12mm",
        price: 245.00,
        unit: "tonne",
        stock: "In Stock",
        stockLevel: 50,
        minOrder: 1,
        image: "steel rebar construction",
        delivery: "2-3 Days",
      },
      {
        id: 103,
        name: "Plywood Sheets 18mm",
        price: 32.50,
        unit: "sheet",
        stock: "Low Stock",
        stockLevel: 15,
        minOrder: 5,
        image: "plywood sheets",
        delivery: "Next Day",
      },
    ],
    performanceMetrics: {
      deliveryOnTime: 97,
      productQuality: 96,
      customerService: 95,
      priceCompetitiveness: 94,
    },
  },
  {
    id: 2,
    name: "ElectroPro Components",
    category: "Electrical Supplies",
    location: "London & SE",
    rating: 4.9,
    reviews: 256,
    verified: true,
    products: [
      {
        id: 201,
        name: "LED Downlight Kit",
        price: 24.99,
        unit: "pack of 6",
        stock: "In Stock",
        stockLevel: 200,
        minOrder: 2,
        image: "led downlights",
        delivery: "Same Day",
      },
      {
        id: 202,
        name: "Consumer Unit 12-Way",
        price: 89.99,
        unit: "unit",
        stock: "In Stock",
        stockLevel: 45,
        minOrder: 1,
        image: "electrical consumer unit",
        delivery: "Next Day",
      },
      {
        id: 203,
        name: "Armoured Cable 10mm²",
        price: 3.85,
        unit: "per metre",
        stock: "In Stock",
        stockLevel: 1000,
        minOrder: 25,
        image: "electrical cable",
        delivery: "Next Day",
      },
    ],
    performanceMetrics: {
      deliveryOnTime: 98,
      productQuality: 99,
      customerService: 97,
      priceCompetitiveness: 92,
    },
  },
  {
    id: 3,
    name: "Premium Fixtures Ltd",
    category: "Bathroom & Kitchen",
    location: "National Showrooms",
    rating: 4.7,
    reviews: 189,
    verified: true,
    products: [
      {
        id: 301,
        name: "Designer Bathroom Suite",
        price: 1249.00,
        unit: "complete set",
        stock: "In Stock",
        stockLevel: 8,
        minOrder: 1,
        image: "luxury bathroom suite",
        delivery: "3-5 Days",
      },
      {
        id: 302,
        name: "Kitchen Sink Stainless",
        price: 189.99,
        unit: "unit",
        stock: "In Stock",
        stockLevel: 23,
        minOrder: 1,
        image: "modern kitchen sink",
        delivery: "2-3 Days",
      },
    ],
    performanceMetrics: {
      deliveryOnTime: 95,
      productQuality: 98,
      customerService: 96,
      priceCompetitiveness: 90,
    },
  },
];

// Mock RFQ data
const myRFQs = [
  {
    id: 1,
    title: "Office Renovation - Electrical Work",
    status: "quotes_received",
    created: "2026-02-15",
    budget: "£15,000 - £20,000",
    deadline: "2026-03-01",
    quotesReceived: 3,
    quotes: [
      {
        contractorId: 2,
        contractorName: "Premier Electrical Solutions",
        totalCost: 18500,
        laborCost: 12000,
        materialCost: 6000,
        otherCosts: 500,
        timeline: "3 weeks",
        warranty: "5 years",
        startDate: "2026-03-10",
        notes: "Includes all materials, testing, and certification",
      },
      {
        contractorId: 4,
        contractorName: "Spark Electrical Services",
        totalCost: 19200,
        laborCost: 13000,
        materialCost: 5800,
        otherCosts: 400,
        timeline: "4 weeks",
        warranty: "3 years",
        startDate: "2026-03-15",
        notes: "Premium materials, phased approach",
      },
      {
        contractorId: 5,
        contractorName: "City Power Solutions",
        totalCost: 17800,
        laborCost: 11500,
        materialCost: 5900,
        otherCosts: 400,
        timeline: "3.5 weeks",
        warranty: "4 years",
        startDate: "2026-03-12",
        notes: "Competitive pricing, experienced team",
      },
    ],
  },
  {
    id: 2,
    title: "Warehouse HVAC Installation",
    status: "open",
    created: "2026-02-18",
    budget: "£50,000 - £70,000",
    deadline: "2026-03-15",
    quotesReceived: 1,
    quotes: [],
  },
];

// Mock orders data
const myOrders = [
  {
    id: "ORD-2401",
    supplier: "BuildMart Supplies",
    date: "2026-02-20",
    total: 2847.50,
    status: "in_transit",
    items: 12,
    deliveryDate: "2026-02-23",
    timeline: [
      { stage: "Order Placed", completed: true, date: "2026-02-20 09:15" },
      { stage: "Processing", completed: true, date: "2026-02-20 14:30" },
      { stage: "Dispatched", completed: true, date: "2026-02-21 08:00" },
      { stage: "In Transit", completed: false, current: true },
      { stage: "Delivered", completed: false },
    ],
  },
  {
    id: "ORD-2398",
    supplier: "ElectroPro Components",
    date: "2026-02-18",
    total: 1234.00,
    status: "delivered",
    items: 8,
    deliveryDate: "2026-02-19",
    timeline: [
      { stage: "Order Placed", completed: true, date: "2026-02-18 11:20" },
      { stage: "Processing", completed: true, date: "2026-02-18 15:45" },
      { stage: "Dispatched", completed: true, date: "2026-02-18 16:30" },
      { stage: "In Transit", completed: true, date: "2026-02-19 07:00" },
      { stage: "Delivered", completed: true, date: "2026-02-19 10:15" },
    ],
  },
];

export default function ContractorSupplierMarketplace() {
  const [activeTab, setActiveTab] = useState("contractors");
  const [selectedContractor, setSelectedContractor] = useState<typeof contractors[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [showQuoteComparison, setShowQuoteComparison] = useState<typeof myRFQs[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getRiskScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (score >= 80) return { label: "Good", color: "bg-blue-100 text-blue-800" };
    if (score >= 70) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Review", color: "bg-red-100 text-red-800" };
  };

  const getStockBadge = (stock: string) => {
    if (stock === "In Stock") return { color: "bg-green-100 text-green-800", icon: CheckCircle };
    if (stock === "Low Stock") return { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle };
    return { color: "bg-red-100 text-red-800", icon: X };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "quotes_received":
        return { label: "Quotes Received", color: "bg-blue-100 text-blue-800" };
      case "open":
        return { label: "Open", color: "bg-green-100 text-green-800" };
      case "accepted":
        return { label: "Accepted", color: "bg-purple-100 text-purple-800" };
      case "in_progress":
        return { label: "In Progress", color: "bg-yellow-100 text-yellow-800" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "in_transit":
        return { label: "In Transit", color: "bg-blue-100 text-blue-800", icon: Truck };
      case "processing":
        return { label: "Processing", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800", icon: Package };
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Contractor & Supplier Marketplace</h1>
              <p className="text-gray-600">
                Connect with verified contractors and suppliers for your construction projects
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowRFQForm(true)} className="bg-black text-white hover:bg-gray-800">
                <Send className="w-4 h-4 mr-2" />
                Request Quote
              </Button>
              <Button variant="outline" className="border-gray-300">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search contractors, suppliers, or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="rfqs">
              My RFQs
              {myRFQs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myRFQs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">
              Orders
              {myOrders.filter((o) => o.status === "in_transit").length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myOrders.filter((o) => o.status === "in_transit").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contractors Tab */}
          <TabsContent value="contractors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contractors.map((contractor) => {
                const riskBadge = getRiskScoreBadge(contractor.riskScore);
                return (
                  <Card
                    key={contractor.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                    onClick={() => setSelectedContractor(contractor)}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-black">{contractor.name}</h3>
                          {contractor.verified && (
                            <Shield className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{contractor.specialty}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{contractor.rating}</span>
                        <span className="text-sm text-gray-500">({contractor.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        {contractor.completedProjects} projects
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Risk Score</span>
                        <Badge className={riskBadge.color}>{riskBadge.label}</Badge>
                      </div>
                      <Progress value={contractor.riskScore} className="h-2" />
                      <span className="text-xs text-gray-500 mt-1 block">{contractor.riskScore}/100</span>
                    </div>

                    {/* Location & Response Time */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {contractor.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Response: {contractor.responseTime}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {contractor.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {contractor.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contractor.skills.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Button variant="outline" className="w-full mt-4 border-gray-300">
                      View Profile
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-8">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="p-6 border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-black">{supplier.name}</h3>
                      {supplier.verified && (
                        <Shield className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{supplier.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{supplier.rating}</span>
                        <span className="text-sm text-gray-500">({supplier.reviews})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {supplier.location}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold mb-3">Performance</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-gray-600">On-Time Delivery</span>
                        <span className="text-xs font-semibold">{supplier.performanceMetrics.deliveryOnTime}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-gray-600">Product Quality</span>
                        <span className="text-xs font-semibold">{supplier.performanceMetrics.productQuality}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-gray-600">Customer Service</span>
                        <span className="text-xs font-semibold">{supplier.performanceMetrics.customerService}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplier.products.map((product) => {
                    const stockBadge = getStockBadge(product.stock);
                    const StockIcon = stockBadge.icon;
                    return (
                      <Card
                        key={product.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200"
                        onClick={() => setSelectedProduct({ ...product, supplier })}
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          <ImageWithFallback
                            src={`https://source.unsplash.com/400x300/?${encodeURIComponent(product.image)}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-semibold text-black mb-2">{product.name}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-2xl font-bold text-black">£{product.price}</div>
                            <div className="text-xs text-gray-500">per {product.unit}</div>
                          </div>
                          <Badge className={stockBadge.color}>
                            <StockIcon className="w-3 h-3 mr-1" />
                            {product.stock}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Min Order:</span>
                            <span className="font-semibold">{product.minOrder} {product.unit}s</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Delivery:</span>
                            <span className="font-semibold">{product.delivery}</span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-3 border-gray-300">
                          Add to Cart
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* My RFQs Tab */}
          <TabsContent value="rfqs" className="space-y-6">
            <div className="grid gap-6">
              {myRFQs.map((rfq) => {
                const statusBadge = getStatusBadge(rfq.status);
                return (
                  <Card key={rfq.id} className="p-6 border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-2">{rfq.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Created: {rfq.created}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Budget: {rfq.budget}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Deadline: {rfq.deadline}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-2xl font-bold text-black">{rfq.quotesReceived}</div>
                          <div className="text-sm text-gray-600">Quotes Received</div>
                        </div>
                        {rfq.quotesReceived > 0 && (
                          <div className="text-sm text-gray-600">
                            Average: £{(rfq.quotes.reduce((sum, q) => sum + q.totalCost, 0) / rfq.quotes.length).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {rfq.quotesReceived > 0 && (
                          <Button
                            onClick={() => setShowQuoteComparison(rfq)}
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Compare Quotes
                          </Button>
                        )}
                        <Button variant="outline" className="border-gray-300">
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid gap-6">
              {myOrders.map((order) => {
                const statusBadge = getOrderStatusBadge(order.status);
                const StatusIcon = statusBadge.icon;
                return (
                  <Card key={order.id} className="p-6 border-gray-200">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-black">{order.id}</h3>
                          <Badge className={statusBadge.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{order.supplier}</span>
                          <span>•</span>
                          <span>{order.items} items</span>
                          <span>•</span>
                          <span>Ordered: {order.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-black">£{order.total.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Expected: {order.deliveryDate}</div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        {order.timeline.map((stage, index) => (
                          <div key={stage.stage} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                  stage.completed
                                    ? "bg-green-100 text-green-600"
                                    : stage.current
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-200 text-gray-400"
                                }`}
                              >
                                {stage.completed ? (
                                  <Check className="w-5 h-5" />
                                ) : stage.current ? (
                                  <Clock className="w-5 h-5" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                                )}
                              </div>
                              <div className="text-xs font-semibold text-center mb-1">{stage.stage}</div>
                              {stage.date && <div className="text-xs text-gray-500 text-center">{stage.date}</div>}
                            </div>
                            {index < order.timeline.length - 1 && (
                              <div
                                className={`h-1 flex-1 ${
                                  stage.completed ? "bg-green-200" : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="border-gray-300">
                        <FileText className="w-4 h-4 mr-2" />
                        View Invoice
                      </Button>
                      <Button variant="outline" className="border-gray-300">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Supplier
                      </Button>
                      {order.status === "delivered" && (
                        <Button variant="outline" className="border-gray-300">
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contractor Profile Modal */}
      {selectedContractor && (
        <Dialog open={!!selectedContractor} onOpenChange={() => setSelectedContractor(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DialogTitle className="text-2xl">{selectedContractor.name}</DialogTitle>
                    {selectedContractor.verified && (
                      <Shield className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <DialogDescription className="text-gray-600 mb-3">{selectedContractor.specialty}</DialogDescription>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{selectedContractor.rating}</span>
                      <span className="text-sm text-gray-500">({selectedContractor.reviews} reviews)</span>
                    </div>
                    <Badge className={getRiskScoreBadge(selectedContractor.riskScore).color}>
                      {getRiskScoreBadge(selectedContractor.riskScore).label} Risk Score
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Key Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Experience</div>
                  <div className="text-xl font-bold">{selectedContractor.yearsExperience} years</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Projects</div>
                  <div className="text-xl font-bold">{selectedContractor.completedProjects}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Response Time</div>
                  <div className="text-xl font-bold">{selectedContractor.responseTime}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Insurance</div>
                  <div className="text-xl font-bold">{selectedContractor.insuranceCoverage}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">On-Time Completion</span>
                      <span className="text-sm font-semibold">{selectedContractor.performanceMetrics.onTimeCompletion}%</span>
                    </div>
                    <Progress value={selectedContractor.performanceMetrics.onTimeCompletion} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Budget Adherence</span>
                      <span className="text-sm font-semibold">{selectedContractor.performanceMetrics.budgetAdherence}%</span>
                    </div>
                    <Progress value={selectedContractor.performanceMetrics.budgetAdherence} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Client Satisfaction</span>
                      <span className="text-sm font-semibold">{selectedContractor.performanceMetrics.clientSatisfaction}%</span>
                    </div>
                    <Progress value={selectedContractor.performanceMetrics.clientSatisfaction} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Safety Record</span>
                      <span className="text-sm font-semibold">{selectedContractor.performanceMetrics.safetyRecord}%</span>
                    </div>
                    <Progress value={selectedContractor.performanceMetrics.safetyRecord} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications & Accreditations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-sm py-2 px-3">
                      <Award className="w-4 h-4 mr-2" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Skills & Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-sm py-2 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Portfolio</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedContractor.portfolio.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                        <ImageWithFallback
                          src={`https://source.unsplash.com/600x400/?${encodeURIComponent(item.image)}`}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {selectedContractor.recentReviews.map((review, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{review.author}</div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <p className="text-gray-600">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                  <Send className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
                <Button variant="outline" className="flex-1 border-gray-300">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" className="flex-1 border-gray-300">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>{selectedProduct.supplier.name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={`https://source.unsplash.com/800x600/?${encodeURIComponent(selectedProduct.image)}`}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl font-bold text-black mb-1">£{selectedProduct.price}</div>
                  <div className="text-gray-600">per {selectedProduct.unit}</div>
                </div>
                <Badge className={getStockBadge(selectedProduct.stock).color}>
                  {selectedProduct.stock}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Available Stock</div>
                  <div className="text-xl font-bold">{selectedProduct.stockLevel} units</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Minimum Order</div>
                  <div className="text-xl font-bold">{selectedProduct.minOrder} {selectedProduct.unit}s</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Delivery Time</div>
                  <div className="text-xl font-bold">{selectedProduct.delivery}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Supplier Rating</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-bold">{selectedProduct.supplier.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="quantity" className="mb-2 block">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={selectedProduct.minOrder}
                    defaultValue={selectedProduct.minOrder}
                    className="border-gray-300"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    Add to Cart
                  </Button>
                  <Button variant="outline" className="border-gray-300">
                    <Send className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* RFQ Form Modal */}
      {showRFQForm && (
        <Dialog open={showRFQForm} onOpenChange={setShowRFQForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request for Quote (RFQ)</DialogTitle>
              <DialogDescription>
                Submit your project details to receive quotes from verified contractors
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <Label htmlFor="rfq-title">Project Title</Label>
                <Input
                  id="rfq-title"
                  placeholder="e.g., Office Electrical Renovation"
                  className="border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="rfq-category">Category</Label>
                <Select>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing & HVAC</SelectItem>
                    <SelectItem value="construction">General Construction</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rfq-description">Project Description</Label>
                <Textarea
                  id="rfq-description"
                  placeholder="Provide detailed information about your project requirements..."
                  rows={6}
                  className="border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfq-budget">Budget Range</Label>
                  <Input
                    id="rfq-budget"
                    placeholder="e.g., £10,000 - £15,000"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="rfq-deadline">Quote Deadline</Label>
                  <Input
                    id="rfq-deadline"
                    type="date"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rfq-start">Preferred Start Date</Label>
                  <Input
                    id="rfq-start"
                    type="date"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="rfq-duration">Expected Duration</Label>
                  <Input
                    id="rfq-duration"
                    placeholder="e.g., 3 weeks"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rfq-location">Project Location</Label>
                <Input
                  id="rfq-location"
                  placeholder="Enter full address"
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-3">
                <Label>Additional Requirements</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="req-insurance" />
                  <Label htmlFor="req-insurance" className="font-normal">
                    Contractor must have minimum £5M insurance
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="req-certified" />
                  <Label htmlFor="req-certified" className="font-normal">
                    Industry certifications required
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="req-references" />
                  <Label htmlFor="req-references" className="font-normal">
                    Must provide recent references
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                  <Send className="w-4 h-4 mr-2" />
                  Submit RFQ
                </Button>
                <Button variant="outline" className="flex-1 border-gray-300" onClick={() => setShowRFQForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quote Comparison Modal */}
      {showQuoteComparison && (
        <Dialog open={!!showQuoteComparison} onOpenChange={() => setShowQuoteComparison(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showQuoteComparison.title}</DialogTitle>
              <DialogDescription>
                Compare quotes from {showQuoteComparison.quotesReceived} contractors
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">Criteria</th>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <th key={index} className="text-left py-3 px-4 font-semibold">
                          {quote.contractorName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-semibold">Total Cost</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          <div className="text-xl font-bold text-black">£{quote.totalCost.toLocaleString()}</div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-3 px-4">Labor Cost</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          £{quote.laborCost.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4">Material Cost</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          £{quote.materialCost.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-3 px-4">Other Costs</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          £{quote.otherCosts.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-semibold">Timeline</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          <Badge variant="secondary">{quote.timeline}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-3 px-4 font-semibold">Start Date</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          {quote.startDate}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-semibold">Warranty</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          <Badge variant="outline">{quote.warranty}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="py-3 px-4">Notes</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4 text-sm text-gray-600">
                          {quote.notes}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Action</td>
                      {showQuoteComparison.quotes.map((quote, index) => (
                        <td key={index} className="py-3 px-4">
                          <div className="flex flex-col gap-2">
                            <Button className="bg-green-600 text-white hover:bg-green-700">
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Accept Quote
                            </Button>
                            <Button variant="outline" className="border-gray-300">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cost Comparison Chart */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-semibold mb-4">Cost Breakdown Comparison</h4>
                <div className="space-y-4">
                  {showQuoteComparison.quotes.map((quote, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{quote.contractorName}</span>
                        <span className="text-lg font-bold">£{quote.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex h-8 rounded overflow-hidden">
                        <div
                          className="bg-blue-500 flex items-center justify-center text-white text-xs"
                          style={{ width: `${(quote.laborCost / quote.totalCost) * 100}%` }}
                        >
                          Labor
                        </div>
                        <div
                          className="bg-green-500 flex items-center justify-center text-white text-xs"
                          style={{ width: `${(quote.materialCost / quote.totalCost) * 100}%` }}
                        >
                          Materials
                        </div>
                        <div
                          className="bg-yellow-500 flex items-center justify-center text-white text-xs"
                          style={{ width: `${(quote.otherCosts / quote.totalCost) * 100}%` }}
                        >
                          Other
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Labor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Materials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Other</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
