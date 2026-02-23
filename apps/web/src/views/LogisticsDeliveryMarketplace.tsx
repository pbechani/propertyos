'use client';

import { useState } from "react";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  CheckCircle,
  Circle,
  Navigation,
  Phone,
  MessageSquare,
  Camera,
  Shield,
  Lock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Route as RouteIcon,
  Plus,
  Check,
  PenTool,
  MapPinned,
  Locate,
  Award,
  BadgeCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

// Type definitions
interface TruckType {
  id: string;
  name: string;
  capacity: string;
  dimensions: string;
  suitable: string[];
  image: string;
  basePrice: number;
}

interface Operator {
  id: string;
  name: string;
  rating: number;
  totalDeliveries: number;
  onTimeRate: number;
  verificationLevel: "basic" | "verified" | "premium";
  quote: number;
  estimatedTime: string;
  availability: string;
  insuranceCoverage: string;
  specialties: string[];
}

interface DeliveryTracking {
  currentLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  origin: { lat: number; lng: number };
  progress: number;
  eta: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: string;
  route: Array<{ lat: number; lng: number; name: string }>;
}

// Mock data
const truckTypes: TruckType[] = [
  {
    id: "pickup",
    name: "Pickup Truck",
    capacity: "1-2 tons",
    dimensions: "8ft x 6ft x 6ft",
    suitable: ["Furniture", "Appliances", "Small loads"],
    image: "https://images.unsplash.com/photo-1519003300449-424ad0405076?w=400",
    basePrice: 150,
  },
  {
    id: "box-truck",
    name: "Box Truck",
    capacity: "3-5 tons",
    dimensions: "20ft x 8ft x 8ft",
    suitable: ["Moving house", "Office relocation", "Large furniture"],
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400",
    basePrice: 350,
  },
  {
    id: "flatbed",
    name: "Flatbed Truck",
    capacity: "5-10 tons",
    dimensions: "24ft x 8ft (open)",
    suitable: ["Construction materials", "Equipment", "Oversized items"],
    image: "https://images.unsplash.com/photo-1622084764374-6b5d1b9fdb46?w=400",
    basePrice: 450,
  },
  {
    id: "semi",
    name: "Semi Trailer",
    capacity: "20+ tons",
    dimensions: "53ft x 8.5ft x 9ft",
    suitable: ["Commercial shipping", "Bulk goods", "Long distance"],
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400",
    basePrice: 800,
  },
];

const mockOperators: Operator[] = [
  {
    id: "OP001",
    name: "Express Logistics Inc.",
    rating: 4.9,
    totalDeliveries: 1247,
    onTimeRate: 98,
    verificationLevel: "premium",
    quote: 420,
    estimatedTime: "2-3 hours",
    availability: "Available Now",
    insuranceCoverage: "$100,000",
    specialties: ["Same-day delivery", "Fragile items", "White glove service"],
  },
  {
    id: "OP002",
    name: "Swift Transport Co.",
    rating: 4.7,
    totalDeliveries: 892,
    onTimeRate: 95,
    verificationLevel: "verified",
    quote: 380,
    estimatedTime: "3-4 hours",
    availability: "Available in 30 mins",
    insuranceCoverage: "$75,000",
    specialties: ["Standard delivery", "Residential moves"],
  },
  {
    id: "OP003",
    name: "Premier Moving Services",
    rating: 4.8,
    totalDeliveries: 2103,
    onTimeRate: 97,
    verificationLevel: "premium",
    quote: 450,
    estimatedTime: "2 hours",
    availability: "Available Now",
    insuranceCoverage: "$150,000",
    specialties: ["Premium service", "Assembly included", "Packing materials"],
  },
  {
    id: "OP004",
    name: "Budget Haulers",
    rating: 4.5,
    totalDeliveries: 567,
    onTimeRate: 92,
    verificationLevel: "basic",
    quote: 320,
    estimatedTime: "4-5 hours",
    availability: "Available in 1 hour",
    insuranceCoverage: "$50,000",
    specialties: ["Economy option", "Basic service"],
  },
];

const mockTracking: DeliveryTracking = {
  currentLocation: { lat: 34.0522, lng: -118.2437 },
  origin: { lat: 34.0489, lng: -118.2518 },
  destination: { lat: 34.0689, lng: -118.2445 },
  progress: 65,
  eta: "18 minutes",
  driverName: "Michael Rodriguez",
  driverPhone: "+1 (555) 123-4567",
  vehicleNumber: "TRK-4821",
  status: "In Transit",
  route: [
    { lat: 34.0489, lng: -118.2518, name: "Origin - Downtown LA" },
    { lat: 34.0522, lng: -118.2437, name: "Current Location - West LA" },
    { lat: 34.0689, lng: -118.2445, name: "Destination - Beverly Hills" },
  ],
};

export default function LogisticsDeliveryMarketplace() {
  const [activeView, setActiveView] = useState<"booking" | "tracking" | "delivery">("booking");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deliveryPhotos] = useState<string[]>([]);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [itemCondition, setItemCondition] = useState<"excellent" | "good" | "damaged" | "">("");
  const [, setShowOperatorDetails] = useState<string | null>(null);

  // Calculate statistics
  const totalBookings = 1247;
  const activeDeliveries = 38;
  const avgRating = 4.7;

  const handleBookingConfirm = () => {
    setShowConfirmDialog(false);
    alert("Booking confirmed! Escrow payment initiated.");
    setActiveView("tracking");
  };

  const handleDeliveryComplete = () => {
    if (!signatureDrawn) {
      alert("Please provide a signature");
      return;
    }
    if (!itemCondition) {
      alert("Please confirm item condition");
      return;
    }
    alert("Delivery confirmed! Escrow payment released to operator.");
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case "premium":
        return (
          <Badge className="bg-purple-600 text-white">
            <Award className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-blue-600 text-white">
            <BadgeCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            Basic
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">
                Logistics & Delivery Marketplace
              </h1>
              <p className="text-sm text-gray-600">
                Book trusted operators for your delivery needs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-gray-300">
                <Package className="w-4 h-4 mr-2" />
                My Bookings
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Bookings</span>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-black">{totalBookings}</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Active Deliveries</span>
                <Truck className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{activeDeliveries}</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Avg. Rating</span>
                <Star className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-black">{avgRating}</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Operators</span>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-black">{mockOperators.length}</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "booking" | "tracking" | "delivery")}>
          <TabsList className="mb-6">
            <TabsTrigger value="booking">New Booking</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="delivery">Delivery Confirmation</TabsTrigger>
          </TabsList>

          {/* Booking Flow Tab */}
          <TabsContent value="booking" className="space-y-6">
            {/* Progress Stepper */}
            <Card className="p-6 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                {[
                  { step: 1, label: "Truck Type" },
                  { step: 2, label: "Route Details" },
                  { step: 3, label: "Compare Quotes" },
                  { step: 4, label: "Confirm" },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          bookingStep >= item.step
                            ? "bg-black text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {bookingStep > item.step ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          item.step
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 ${
                          bookingStep >= item.step ? "text-black font-medium" : "text-gray-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          bookingStep > item.step ? "bg-black" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Step 1: Select Truck Type */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Select Truck Type</h2>
                <div className="grid grid-cols-2 gap-4">
                  {truckTypes.map((truck) => (
                    <Card
                      key={truck.id}
                      className={`p-5 cursor-pointer transition-all border-2 ${
                        selectedTruck?.id === truck.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedTruck(truck)}
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          <Truck className="w-full h-full p-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{truck.name}</h3>
                            <Checkbox checked={selectedTruck?.id === truck.id} />
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3" />
                              Capacity: {truck.capacity}
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3" />
                              Size: {truck.dimensions}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-black">
                            From ${truck.basePrice}/trip
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Suitable for:</div>
                        <div className="flex flex-wrap gap-1">
                          {truck.suitable.map((item) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="text-xs bg-gray-100"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setBookingStep(2)}
                    disabled={!selectedTruck}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Route Details */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Route Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookingStep(1)}
                  >
                    Back
                  </Button>
                </div>

                <Card className="p-6 border-gray-200">
                  <div className="space-y-4">
                    {/* Origin */}
                    <div>
                      <Label htmlFor="origin" className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        Pickup Location
                      </Label>
                      <Input
                        id="origin"
                        placeholder="Enter pickup address"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="border-gray-300"
                      />
                    </div>

                    {/* Destination */}
                    <div>
                      <Label htmlFor="destination" className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        Delivery Location
                      </Label>
                      <Input
                        id="destination"
                        placeholder="Enter delivery address"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="border-gray-300"
                      />
                    </div>

                    {/* Pickup Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pickup-date" className="mb-2">
                          Pickup Date
                        </Label>
                        <Input
                          id="pickup-date"
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickup-time" className="mb-2">
                          Pickup Time
                        </Label>
                        <Select>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning (8-11 AM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12-3 PM)</SelectItem>
                            <SelectItem value="evening">Evening (4-7 PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="notes" className="mb-2">
                        Special Instructions (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special handling requirements, access instructions, etc."
                        rows={3}
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setBookingStep(3)}
                    disabled={!origin || !destination || !pickupDate}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Get Quotes
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Compare Operators */}
            {bookingStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Compare Operator Quotes</h2>
                    <p className="text-sm text-gray-600">
                      {mockOperators.length} operators available for your route
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookingStep(2)}
                  >
                    Back
                  </Button>
                </div>

                <div className="space-y-3">
                  {mockOperators.map((operator) => (
                    <Card
                      key={operator.id}
                      className={`p-5 cursor-pointer transition-all border-2 ${
                        selectedOperator?.id === operator.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedOperator(operator)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{operator.name}</h3>
                            {getVerificationBadge(operator.verificationLevel)}
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              {operator.availability}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-black">
                                  {operator.rating}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {operator.totalDeliveries} deliveries
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="text-gray-600 mb-1">On-Time Rate</div>
                              <div className="text-xs">
                                <span className="font-semibold text-green-600">
                                  {operator.onTimeRate}%
                                </span>
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="text-gray-600 mb-1">Insurance</div>
                              <div className="text-xs font-semibold text-black">
                                {operator.insuranceCoverage}
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="text-gray-600 mb-1">ETA</div>
                              <div className="text-xs font-semibold text-black">
                                {operator.estimatedTime}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {operator.specialties.map((specialty) => (
                              <Badge
                                key={specialty}
                                variant="secondary"
                                className="text-xs bg-blue-50 text-blue-700"
                              >
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOperatorDetails(operator.id);
                            }}
                            className="text-xs"
                          >
                            View Details
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>

                        <div className="text-right ml-6">
                          <div className="text-3xl font-bold text-black mb-1">
                            ${operator.quote}
                          </div>
                          <div className="text-xs text-gray-500 mb-3">Total cost</div>
                          <Checkbox checked={selectedOperator?.id === operator.id} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setBookingStep(4)}
                    disabled={!selectedOperator}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Review Booking
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm Booking */}
            {bookingStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Review & Confirm</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookingStep(3)}
                  >
                    Back
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Booking Summary */}
                  <div className="col-span-2 space-y-4">
                    <Card className="p-6 border-gray-200">
                      <h3 className="font-semibold mb-4">Booking Summary</h3>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Truck className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Vehicle Type</div>
                            <div className="font-semibold">{selectedTruck?.name}</div>
                            <div className="text-xs text-gray-500">
                              {selectedTruck?.capacity}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-1" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Pickup Location</div>
                            <div className="font-semibold">{origin}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-red-600 mt-1" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Delivery Location</div>
                            <div className="font-semibold">{destination}</div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Pickup Date & Time</div>
                            <div className="font-semibold">
                              {new Date(pickupDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Operator</div>
                            <div className="font-semibold">{selectedOperator?.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">
                                {selectedOperator?.rating} ({selectedOperator?.totalDeliveries}{" "}
                                deliveries)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Escrow Information */}
                    <Card className="p-6 bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-2">
                            Escrow-Protected Payment
                          </h3>
                          <p className="text-sm text-blue-700 mb-3">
                            Your payment will be securely held in escrow until successful
                            delivery confirmation. Funds are only released to the operator
                            after you confirm receipt and condition of items.
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Lock className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              Bank-grade security • Fraud protection • Full refund guarantee
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Cost Breakdown */}
                  <div>
                    <Card className="p-6 border-gray-200">
                      <h3 className="font-semibold mb-4">Cost Breakdown</h3>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base fare</span>
                          <span className="font-medium">${selectedOperator?.quote || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Insurance fee</span>
                          <span className="font-medium">$25</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Platform fee</span>
                          <span className="font-medium">$15</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="text-2xl font-bold text-black">
                            ${(selectedOperator?.quote || 0) + 40}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full bg-black text-white hover:bg-gray-800"
                      >
                        Confirm & Pay
                        <Lock className="w-4 h-4 ml-2" />
                      </Button>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Shield className="w-3 h-3" />
                          <span className="font-medium">Payment protected by escrow</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Your payment is held securely until delivery is confirmed
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Live Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card className="p-6 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Active Delivery</h2>
                  <p className="text-sm text-gray-600">
                    Tracking #: TRK-2024-001247
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white">
                  <Navigation className="w-3 h-3 mr-1" />
                  {mockTracking.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Map Preview */}
                <div className="col-span-2">
                  <div className="relative bg-gray-100 rounded-xl border border-gray-200 h-96 overflow-hidden">
                    {/* Simulated map background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />

                    {/* Route line */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <polyline
                        points="80,300 200,250 350,200 500,180"
                        fill="none"
                        stroke="url(#routeGradient)"
                        strokeWidth="4"
                        strokeDasharray="8,4"
                      />
                    </svg>

                    {/* Origin marker */}
                    <div className="absolute top-72 left-16 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <MapPin className="w-8 h-8 text-green-600 fill-green-100" />
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm text-xs font-medium">
                          Origin
                        </div>
                      </div>
                    </div>

                    {/* Current location (moving truck) */}
                    <div className="absolute top-56 left-56 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
                      <div className="relative">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white px-2 py-1 rounded shadow-lg text-xs font-medium">
                          Current Location
                        </div>
                      </div>
                    </div>

                    {/* Destination marker */}
                    <div className="absolute top-40 right-24 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <MapPin className="w-8 h-8 text-red-600 fill-red-100" />
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm text-xs font-medium">
                          Destination
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Delivery Progress</span>
                        <span className="text-sm font-bold text-blue-600">
                          {mockTracking.progress}%
                        </span>
                      </div>
                      <Progress value={mockTracking.progress} className="h-2" />
                    </div>
                  </div>

                  {/* Route Preview */}
                  <Card className="mt-4 p-4 border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <RouteIcon className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-sm">Route Preview</h3>
                    </div>
                    <div className="space-y-3">
                      {mockTracking.route.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                index === 0
                                  ? "bg-green-500"
                                  : index === mockTracking.route.length - 1
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            {index < mockTracking.route.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-300 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="text-sm font-medium">{point.name}</div>
                            <div className="text-xs text-gray-500">
                              {index === 1 ? "Current location" : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Tracking Info */}
                <div className="space-y-4">
                  {/* ETA Card */}
                  <Card className="p-5 border-gray-200 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Estimated Arrival</div>
                        <div className="text-2xl font-bold text-black">
                          {mockTracking.eta}
                        </div>
                      </div>
                    </div>
                    <Progress value={mockTracking.progress} className="h-2" />
                    <div className="text-xs text-gray-500 mt-2">
                      {mockTracking.progress}% complete
                    </div>
                  </Card>

                  {/* Driver Info */}
                  <Card className="p-5 border-gray-200">
                    <h3 className="font-semibold mb-4">Driver Information</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{mockTracking.driverName}</div>
                        <div className="text-sm text-gray-600">
                          Vehicle: {mockTracking.vehicleNumber}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full border-gray-300">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Driver
                      </Button>
                      <Button variant="outline" className="w-full border-gray-300">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </Card>

                  {/* Escrow Status */}
                  <Card className="p-5 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Payment Secured
                        </h3>
                        <p className="text-sm text-yellow-700 mb-2">
                          $460 held in escrow
                        </p>
                        <Badge className="bg-yellow-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Additional Info */}
                  <Card className="p-5 border-gray-200">
                    <h3 className="font-semibold mb-3">Shipment Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking #:</span>
                        <span className="font-medium">TRK-2024-001247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">10:30 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">12.5 miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className="bg-blue-600 text-white">In Transit</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Delivery Confirmation Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Delivery Confirmation</h2>
                <p className="text-sm text-gray-600">
                  Please verify the delivery and confirm item condition before releasing payment
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Confirmation Steps */}
                <div className="col-span-2 space-y-6">
                  {/* Geo-tagged Proof Photo */}
                  <Card className="p-5 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Geo-Tagged Proof Photos</h3>
                        <p className="text-xs text-gray-600">
                          Upload photos with location verification
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {deliveryPhotos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img src={photo} alt={`Delivery ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <div className="flex items-center gap-1 text-white text-xs">
                              <MapPinned className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </button>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Locate className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-green-900 mb-1">
                            Location Verified
                          </div>
                          <div className="text-xs text-green-700">
                            Photos taken at delivery address: 123 Beverly Hills Drive, CA
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            GPS: 34.0689° N, 118.2445° W
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Signature Capture */}
                  <Card className="p-5 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <PenTool className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Digital Signature</h3>
                        <p className="text-xs text-gray-600">
                          Sign to acknowledge receipt
                        </p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center mb-3 bg-gray-50">
                      {signatureDrawn ? (
                        <div className="text-center">
                          <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <div className="text-sm font-medium text-green-600">
                            Signature Captured
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <PenTool className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">Click to sign</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSignatureDrawn(true)}
                        className="flex-1 border-gray-300"
                      >
                        Sign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSignatureDrawn(false)}
                        className="border-gray-300"
                      >
                        Clear
                      </Button>
                    </div>
                  </Card>

                  {/* Condition Confirmation */}
                  <Card className="p-5 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Item Condition</h3>
                        <p className="text-xs text-gray-600">
                          Confirm the condition of delivered items
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setItemCondition("excellent")}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          itemCondition === "excellent"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div className="text-left">
                              <div className="font-semibold">Excellent Condition</div>
                              <div className="text-xs text-gray-600">
                                No damage, as expected
                              </div>
                            </div>
                          </div>
                          {itemCondition === "excellent" && (
                            <Check className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setItemCondition("good")}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          itemCondition === "good"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Circle className="w-5 h-5 text-blue-600" />
                            <div className="text-left">
                              <div className="font-semibold">Good Condition</div>
                              <div className="text-xs text-gray-600">
                                Minor cosmetic issues
                              </div>
                            </div>
                          </div>
                          {itemCondition === "good" && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setItemCondition("damaged")}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          itemCondition === "damaged"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <div className="text-left">
                              <div className="font-semibold">Damaged</div>
                              <div className="text-xs text-gray-600">
                                Report damage claim
                              </div>
                            </div>
                          </div>
                          {itemCondition === "damaged" && (
                            <Check className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </button>
                    </div>

                    {itemCondition === "damaged" && (
                      <div className="mt-4">
                        <Label htmlFor="damage-notes" className="mb-2">
                          Damage Description
                        </Label>
                        <Textarea
                          id="damage-notes"
                          placeholder="Describe the damage in detail..."
                          rows={3}
                          className="border-gray-300"
                        />
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-4">
                  {/* Delivery Summary */}
                  <Card className="p-5 border-gray-200">
                    <h3 className="font-semibold mb-4">Delivery Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Tracking Number</div>
                        <div className="font-medium">TRK-2024-001247</div>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-gray-600 mb-1">Operator</div>
                        <div className="font-medium">Express Logistics Inc.</div>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-gray-600 mb-1">Delivered By</div>
                        <div className="font-medium">{mockTracking.driverName}</div>
                      </div>
                      <Separator />
                      <div>
                        <div className="text-gray-600 mb-1">Delivery Time</div>
                        <div className="font-medium">{new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </Card>

                  {/* Escrow Payment Status */}
                  <Card className="p-5 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3 mb-4">
                      <Lock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Escrow Payment
                        </h3>
                        <p className="text-sm text-yellow-700">
                          $460 ready to release
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Amount held:</span>
                        <span className="font-semibold">$460.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <Badge className="bg-yellow-600 text-white">
                          Pending Confirmation
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-yellow-700">
                      <Info className="w-3 h-3 inline mr-1" />
                      Payment will be released to operator after confirmation
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={handleDeliveryComplete}
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      disabled={!signatureDrawn || !itemCondition}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Delivery
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-gray-300"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                  </div>

                  {/* Verification Status */}
                  <Card className="p-4 border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-3">
                      Verification Checklist
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        {deliveryPhotos.length > 0 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={deliveryPhotos.length > 0 ? "text-green-600" : "text-gray-500"}>
                          Proof photos uploaded
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {deliveryPhotos.length > 0 ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={deliveryPhotos.length > 0 ? "text-green-600" : "text-gray-500"}>
                          Location verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {signatureDrawn ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={signatureDrawn ? "text-green-600" : "text-gray-500"}>
                          Signature captured
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {itemCondition ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        <span className={itemCondition ? "text-green-600" : "text-gray-500"}>
                          Condition confirmed
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Review your booking details before confirming payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Operator:</span>
                <span className="font-medium">{selectedOperator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-semibold text-lg">
                  ${(selectedOperator?.quote || 0) + 40}
                </span>
              </div>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  Your payment will be held in secure escrow until delivery is confirmed
                </div>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingConfirm}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Lock className="w-4 h-4 mr-2" />
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
