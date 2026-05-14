'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  Star,
  Award,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Briefcase,
  ChevronRight,
  Search,
  Filter,
  X,
  Building2,
  Phone,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { getAccessToken } from "@/lib/auth-session";

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
  {
    id: 4,
    name: "Skyline Structural Works",
    specialty: "Structural Engineering",
    location: "Leeds, UK",
    rating: 4.8,
    reviews: 76,
    completedProjects: 132,
    riskScore: 91,
    certifications: ["ICE", "CIOB", "CSCS", "ISO 45001"],
    skills: ["Structural Reinforcement", "Foundation Analysis", "Steel Works", "Site Supervision"],
    avatar: "structural engineer site",
    responseTime: "2-3 hours",
    insuranceCoverage: "£8M",
    yearsExperience: 11,
    verified: true,
    portfolio: [
      { id: 1, title: "Mixed-Use Tower Reinforcement", image: "construction steel framework" },
      { id: 2, title: "Bridge Deck Rehabilitation", image: "bridge structural engineering" },
    ],
    recentReviews: [
      { author: "Nadia Patel", rating: 5, text: "Reliable structural guidance and execution", date: "2 weeks ago" },
    ],
    performanceMetrics: {
      onTimeCompletion: 94,
      budgetAdherence: 93,
      clientSatisfaction: 95,
      safetyRecord: 99,
    },
  },
  {
    id: 5,
    name: "Prime Interiors Co",
    specialty: "Interior Fit-Out",
    location: "Bristol, UK",
    rating: 4.7,
    reviews: 112,
    completedProjects: 164,
    riskScore: 89,
    certifications: ["FIS", "CHAS", "CSCS", "ISO 9001"],
    skills: ["Office Fit-Out", "Residential Interiors", "Ceilings & Partitions", "Joinery"],
    avatar: "interior contractor",
    responseTime: "4-6 hours",
    insuranceCoverage: "£6M",
    yearsExperience: 9,
    verified: true,
    portfolio: [
      { id: 1, title: "Corporate Office Fit-Out", image: "office fit out" },
      { id: 2, title: "Boutique Apartment Interiors", image: "apartment interior design" },
    ],
    recentReviews: [
      { author: "Lewis Grant", rating: 5, text: "Great detailing and handover quality", date: "1 month ago" },
    ],
    performanceMetrics: {
      onTimeCompletion: 92,
      budgetAdherence: 94,
      clientSatisfaction: 96,
      safetyRecord: 97,
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
  {
    id: 4,
    name: "Civic Site Equipment",
    category: "Site Equipment",
    location: "Midlands Hub",
    rating: 4.6,
    reviews: 141,
    verified: true,
    products: [
      {
        id: 401,
        name: "Scaffold Tower Set",
        price: 799.0,
        unit: "set",
        stock: "In Stock",
        stockLevel: 34,
        minOrder: 1,
        image: "construction scaffolding",
        delivery: "2-3 Days",
      },
      {
        id: 402,
        name: "Portable Site Generator",
        price: 1199.0,
        unit: "unit",
        stock: "Low Stock",
        stockLevel: 9,
        minOrder: 1,
        image: "site power generator",
        delivery: "Next Day",
      },
    ],
    performanceMetrics: {
      deliveryOnTime: 94,
      productQuality: 95,
      customerService: 93,
      priceCompetitiveness: 91,
    },
  },
  {
    id: 5,
    name: "Guardian Safety Supply",
    category: "Safety & PPE",
    location: "London, UK",
    rating: 4.8,
    reviews: 207,
    verified: true,
    products: [
      {
        id: 501,
        name: "Safety Helmet Pack",
        price: 54.99,
        unit: "pack of 10",
        stock: "In Stock",
        stockLevel: 120,
        minOrder: 2,
        image: "construction safety helmets",
        delivery: "Same Day",
      },
      {
        id: 502,
        name: "High-Vis Vest Bundle",
        price: 39.99,
        unit: "pack of 10",
        stock: "In Stock",
        stockLevel: 180,
        minOrder: 2,
        image: "high visibility safety vests",
        delivery: "Next Day",
      },
    ],
    performanceMetrics: {
      deliveryOnTime: 98,
      productQuality: 97,
      customerService: 96,
      priceCompetitiveness: 93,
    },
  },
];

export default function ServiceProviderMarketplace() {
  const searchParams = useSearchParams();
  const [selectedProviderType, setSelectedProviderType] = useState("all");
  const [selectedContractor, setSelectedContractor] = useState<typeof contractors[0] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<
    ((typeof suppliers)[number]["products"][number] & {
      supplier: (typeof suppliers)[number];
    }) | null
  >(null);
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRequestQuote = () => {
    const token = getAccessToken();
    if (token) {
      setShowRFQForm(true);
      return;
    }

    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("rfq", "1");
      const nextPath = `${currentUrl.pathname}${currentUrl.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  };

  const handleAddToCart = (productId?: number) => {
    const token = getAccessToken();
    if (token) {
      toast.success("Item added to cart.");
      return;
    }

    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("cart", "1");
      if (productId) {
        currentUrl.searchParams.set("productId", String(productId));
      }
      const nextPath = `${currentUrl.pathname}${currentUrl.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  };

  useEffect(() => {
    const shouldOpenRFQ = searchParams.get("rfq") === "1";
    const shouldAddToCart = searchParams.get("cart") === "1";

    if (!shouldOpenRFQ && !shouldAddToCart) {
      return;
    }

    const token = getAccessToken();
    if (!token || typeof window === "undefined") {
      return;
    }

    if (shouldOpenRFQ) {
      setShowRFQForm(true);
    }

    if (shouldAddToCart) {
      toast.success("Item added to cart.");
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("rfq");
    currentUrl.searchParams.delete("cart");
    currentUrl.searchParams.delete("productId");
    const updatedPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.history.replaceState({}, "", updatedPath);
  }, [searchParams]);

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

  const contractorTypes = Array.from(new Set(contractors.map((contractor) => contractor.specialty))).sort();
  const supplierTypes = Array.from(new Set(suppliers.map((supplier) => supplier.category))).sort();

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesContractorSearch = (contractor: (typeof contractors)[number]) => {
    if (!normalizedSearch) return true;
    return [
      contractor.name,
      contractor.specialty,
      contractor.location,
      contractor.skills.join(" "),
      contractor.certifications.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  };

  const matchesSupplierSearch = (supplier: (typeof suppliers)[number]) => {
    if (!normalizedSearch) return true;
    const productText = supplier.products.map((product) => product.name).join(" ");
    return [supplier.name, supplier.category, supplier.location, productText]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  };

  const selectedContractorType = selectedProviderType.startsWith("contractor:")
    ? selectedProviderType.replace("contractor:", "")
    : null;
  const selectedSupplierType = selectedProviderType.startsWith("supplier:")
    ? selectedProviderType.replace("supplier:", "")
    : null;

  const filteredContractors = contractors
    .filter((contractor) => (selectedContractorType ? contractor.specialty === selectedContractorType : true))
    .filter(matchesContractorSearch);

  const filteredSuppliers = suppliers
    .filter((supplier) => (selectedSupplierType ? supplier.category === selectedSupplierType : true))
    .filter(matchesSupplierSearch);

  const showContractorCategory =
    selectedProviderType === "all" ||
    selectedProviderType === "contractors" ||
    selectedProviderType.startsWith("contractor:");
  const showSupplierCategory =
    selectedProviderType === "all" ||
    selectedProviderType === "suppliers" ||
    selectedProviderType.startsWith("supplier:");

  const displayedContractors = filteredContractors.slice(0, 5);
  const displayedSuppliers = filteredSuppliers.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Service Provider Marketplace</h1>
              <p className="text-muted-foreground">
                Connect with verified service providers for your real estate projects
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRequestQuote} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="w-4 h-4 mr-2" />
                Request Quote
              </Button>
              <Button variant="outline" className="border-border">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search service providers, categories, or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-input bg-input-background"
            />
          </div>

          <div className="mt-4 max-w-sm">
            <Label className="text-sm text-muted-foreground mb-2 block">Service Provider Type</Label>
            <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
              <SelectTrigger className="border-input bg-input-background">
                <SelectValue placeholder="Select service provider type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Providers</SelectItem>
                <SelectItem value="contractors">Contractors</SelectItem>
                {contractorTypes.map((contractorType) => (
                  <SelectItem key={`contractor-${contractorType}`} value={`contractor:${contractorType}`}>
                    {contractorType}
                  </SelectItem>
                ))}
                <SelectItem value="suppliers">Suppliers</SelectItem>
                {supplierTypes.map((supplierType) => (
                  <SelectItem key={`supplier-${supplierType}`} value={`supplier:${supplierType}`}>
                    {supplierType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-10">
          {showContractorCategory && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">{selectedContractorType ?? "Contractors"}</h2>
                <Badge variant="secondary">Showing {displayedContractors.length} of {filteredContractors.length}</Badge>
              </div>

              {displayedContractors.length === 0 ? (
                <Card className="p-8 border-border text-center text-muted-foreground">No contractor providers match your search.</Card>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedContractors.map((contractor) => {
                const riskBadge = getRiskScoreBadge(contractor.riskScore);
                return (
                  <Card
                    key={contractor.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-border bg-card"
                    onClick={() => setSelectedContractor(contractor)}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{contractor.name}</h3>
                          {contractor.verified && (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contractor.specialty}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{contractor.rating}</span>
                        <span className="text-sm text-muted-foreground">({contractor.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        {contractor.completedProjects} projects
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <Badge className={riskBadge.color}>{riskBadge.label}</Badge>
                      </div>
                      <Progress value={contractor.riskScore} className="h-2" />
                      <span className="text-xs text-muted-foreground mt-1 block">{contractor.riskScore}/100</span>
                    </div>

                    {/* Location & Response Time */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {contractor.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                    <Button variant="outline" className="w-full mt-4 border-border">
                      View Profile
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Card>
                );
              })}
            </div>
              )}
            </section>
          )}

          {showSupplierCategory && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">{selectedSupplierType ?? "Suppliers"}</h2>
                <Badge variant="secondary">Showing {displayedSuppliers.length} of {filteredSuppliers.length}</Badge>
              </div>

              {displayedSuppliers.length === 0 ? (
                <Card className="p-8 border-border text-center text-muted-foreground">No supplier providers match your search.</Card>
              ) : (
                displayedSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-6 border-border bg-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">{supplier.name}</h3>
                      {supplier.verified && (
                        <Shield className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{supplier.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{supplier.rating}</span>
                        <span className="text-sm text-muted-foreground">({supplier.reviews})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {supplier.location}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="text-sm font-semibold mb-3">Performance</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">On-Time Delivery</span>
                        <span className="text-xs font-semibold">{supplier.performanceMetrics.deliveryOnTime}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Product Quality</span>
                        <span className="text-xs font-semibold">{supplier.performanceMetrics.productQuality}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Customer Service</span>
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
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border bg-card"
                        onClick={() => setSelectedProduct({ ...product, supplier })}
                      >
                        <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                          <ImageWithFallback
                            src={`https://source.unsplash.com/400x300/?${encodeURIComponent(product.image)}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{product.name}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-2xl font-bold text-foreground">£{product.price}</div>
                            <div className="text-xs text-muted-foreground">per {product.unit}</div>
                          </div>
                          <Badge className={stockBadge.color}>
                            <StockIcon className="w-3 h-3 mr-1" />
                            {product.stock}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Min Order:</span>
                            <span className="font-semibold">{product.minOrder} {product.unit}s</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Delivery:</span>
                            <span className="font-semibold">{product.delivery}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-3 border-border"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product.id);
                          }}
                        >
                          Add to Cart
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ))
              )}
            </section>
          )}

          {!showContractorCategory && !showSupplierCategory && (
            <Card className="p-8 border-border text-center text-muted-foreground">No service provider type selected.</Card>
          )}
        </div>
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
                <Button className="flex-1 bg-black text-white hover:bg-gray-800" onClick={handleRequestQuote}>
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
                  <Button
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={() => handleAddToCart(selectedProduct.id)}
                  >
                    Add to Cart
                  </Button>
                  <Button variant="outline" className="border-gray-300" onClick={handleRequestQuote}>
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

    </div>
  );
}
