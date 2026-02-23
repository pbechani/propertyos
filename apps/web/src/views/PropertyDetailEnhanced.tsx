'use client';

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { usePathname, useSearchParams } from "next/navigation";
import {
  MapPin, Bed, Bath, Car, Maximize, Heart, Share2, Phone, MessageSquare,
  ChevronLeft, CheckCircle2, MapPinned, Shield, AlertTriangle,
  Calendar, Clock, FileText, History, Eye, Info, Flag, ChevronRight, X, Video, ZoomIn
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/auth-session";
import { propertiesApi, type PropertyListing } from "@/lib/api-client";

const DEFAULT_AGENT_IMAGE = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop";
const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop";

type SimilarProperty = {
  id: string;
  image: string;
  title: string;
  location: string;
  price: string;
};

function formatMoney(price: string, currency: string): string {
  const value = Number(price);
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function toFeatureLabel(feature: string): string {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (part) => part.toUpperCase());
}

function mapSimilarProperty(listing: PropertyListing): SimilarProperty {
  const city = listing.location?.city ?? "";
  const region = listing.location?.region ?? "";
  const location = [city, region].filter(Boolean).join(", ") || "Location unavailable";
  const primaryImage = listing.media?.find((media) => media.is_primary)?.url;

  return {
    id: listing.id,
    image: primaryImage || DEFAULT_PROPERTY_IMAGE,
    title: listing.title,
    location,
    price: formatMoney(listing.price, listing.currency),
  };
}

type PropertyDetailState = {
  title: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  garage: number;
  floorArea: number;
  images: string[];
  description: string;
  features: Array<{ label: string; icon: boolean }>;
  agent: {
    id: string;
    name: string;
    title: string;
    verified: boolean;
    trustScore: number;
    image: string;
  };
  verificationStatus: string;
  propertyType: string;
  listingStatus: string;
  createdAt: string;
  updatedAt: string;
};

function getEmptyPropertyDetail(): PropertyDetailState {
  return {
    title: "",
    address: "Address unavailable",
    price: formatMoney("0", "USD"),
    beds: 0,
    baths: 0,
    garage: 0,
    floorArea: 0,
    images: [DEFAULT_PROPERTY_IMAGE],
    description: "",
    features: [],
    agent: {
      id: "",
      name: "Agent information unavailable",
      title: "",
      verified: false,
      trustScore: 0,
      image: DEFAULT_AGENT_IMAGE,
    },
    verificationStatus: "UNVERIFIED",
    propertyType: "",
    listingStatus: "",
    createdAt: "",
    updatedAt: "",
  };
}

export default function PropertyDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = typeof id === "string" ? id : "";
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFraudReport, setShowFraudReport] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1); // 1: Select type, 2: Select date/time, 3: Confirmation
  const [viewingType, setViewingType] = useState("inPerson");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [viewerPhone, setViewerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [fraudReportType, setFraudReportType] = useState<
    'double_sale' | 'fake_title' | 'non_existent' | 'misrepresentation' | 'other'
  >('misrepresentation');
  const [fraudDescription, setFraudDescription] = useState("");
  const [fraudError, setFraudError] = useState("");
  const [fraudSuccess, setFraudSuccess] = useState("");
  const [isSubmittingFraud, setIsSubmittingFraud] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<SimilarProperty[]>([]);

  const handleAddToFavourites = () => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    // TODO: Persist saved property when favorites backend endpoint is available.
  };

  const getActionToken = () => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return null;
    }

    return token;
  };

  const handleSubmitInquiry = async () => {
    if (!propertyId) {
      setInquiryError("Unable to identify this listing.");
      return;
    }

    if (isSoldListing) {
      setInquiryError("This property is sold. Inquiries are disabled.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    const payloadMessage = [
      inquiryMessage.trim() || "General inquiry",
      inquiryName.trim() ? `Name: ${inquiryName.trim()}` : "",
      inquiryEmail.trim() ? `Email: ${inquiryEmail.trim()}` : "",
      inquiryPhone.trim() ? `Phone: ${inquiryPhone.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setIsSubmittingInquiry(true);
    setInquiryError("");
    setInquirySuccess("");

    try {
      await propertiesApi.createInquiry(token, propertyId, {
        inquiryType: 'question',
        message: payloadMessage,
      });
      setInquirySuccess("Inquiry sent successfully.");
      setInquiryMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send inquiry right now.";
      setInquiryError(message);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleSubmitFraudReport = async () => {
    if (!propertyId) {
      setFraudError("Unable to identify this listing.");
      return;
    }

    if (!fraudDescription.trim()) {
      setFraudError("Please provide a description.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    setIsSubmittingFraud(true);
    setFraudError("");
    setFraudSuccess("");

    try {
      await propertiesApi.submitFraudReport(token, propertyId, {
        reportType: fraudReportType,
        description: fraudDescription.trim(),
      });
      setFraudSuccess("Fraud report submitted successfully.");
      setFraudDescription("");
      setTimeout(() => setShowFraudReport(false), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit fraud report right now.";
      setFraudError(message);
    } finally {
      setIsSubmittingFraud(false);
    }
  };

  const handleConfirmViewing = async () => {
    if (!propertyId) {
      setScheduleError("Unable to identify this listing.");
      return;
    }

    if (isSoldListing) {
      setScheduleError("This property is sold. Viewing requests are disabled.");
      return;
    }

    if (!selectedDate || !selectedTime || !viewerName.trim() || !viewerEmail.trim() || !viewerPhone.trim()) {
      setScheduleError("Please complete date, time and contact details before confirming.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    setIsSubmittingSchedule(true);
    setScheduleError("");
    setScheduleSuccess("");

    try {
      await propertiesApi.createInquiry(token, propertyId, {
        inquiryType: 'viewing',
        preferredDate: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        message: [
          `Viewing Type: ${viewingType === 'inPerson' ? 'In-Person' : 'Virtual'}`,
          `Name: ${viewerName}`,
          `Email: ${viewerEmail}`,
          `Phone: ${viewerPhone}`,
          specialRequests.trim() ? `Special Requests: ${specialRequests.trim()}` : '',
        ]
          .filter(Boolean)
          .join("\n"),
      });

      setScheduleSuccess("Viewing request submitted successfully.");
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleStep(1);
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit viewing request right now.";
      setScheduleError(message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const [property, setProperty] = useState<PropertyDetailState>(getEmptyPropertyDetail);
  const isSoldListing = property.listingStatus.toLowerCase() === 'sold';

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    const loadProperty = async () => {
      setIsLoadingProperty(true);
      setPropertyError("");

      try {
        const listing = await propertiesApi.getById(propertyId);

        let relatedListings: PropertyListing[] = [];
        try {
          const relatedResponse = await propertiesApi.search({
            type: listing.property_type,
            sort: 'newest',
            limit: 12,
          });
          relatedListings = relatedResponse.data;
        } catch {
          relatedListings = [];
        }

        let mappedAgent = getEmptyPropertyDetail().agent;
        if (listing.agent_id) {
          try {
            const profile = await propertiesApi.getAgentProfile(listing.agent_id);
            const trustScore =
              profile.totalListings > 0
                ? Math.min(
                    100,
                    Math.round((profile.verifiedListings / profile.totalListings) * 100),
                  )
                : 0;

            mappedAgent = {
              id: profile.id,
              name: `${profile.firstName} ${profile.lastName}`.trim(),
              title: profile.primaryCity,
              verified: profile.status === "active",
              trustScore,
              image: profile.avatarUrl || DEFAULT_AGENT_IMAGE,
            };
          } catch {
            mappedAgent = {
              ...getEmptyPropertyDetail().agent,
              id: listing.agent_id,
            };
          }
        }

        const city = listing.location?.city ?? "";
        const region = listing.location?.region ?? "";
        const country = listing.location?.country ?? "";
        const address = [city, region, country].filter(Boolean).join(", ") || "Address unavailable";
        const images =
          listing.media?.map((media) => media.url).filter(Boolean) ?? [];
        const mappedFeatures = Array.isArray(listing.features)
          ? listing.features
              .filter((feature): feature is string => typeof feature === "string")
              .map((feature) => ({ label: toFeatureLabel(feature), icon: true }))
          : [];

        setProperty((prev) => ({
          title: listing.title,
          address,
          price: formatMoney(listing.price, listing.currency),
          beds: listing.bedrooms ?? 0,
          baths: listing.bathrooms ?? 0,
          garage: listing.parking_spaces ?? 0,
          floorArea: listing.area_sqm ? Number(listing.area_sqm) : 0,
          images: images.length > 0 ? images : [DEFAULT_PROPERTY_IMAGE],
          description: listing.description || "",
          features: mappedFeatures,
          agent: mappedAgent,
          verificationStatus: listing.verification_status.toUpperCase(),
          propertyType: listing.property_type,
          listingStatus: listing.status,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
        }));
        const similar = relatedListings
          .filter((item) => item.id !== listing.id)
          .filter((item) => item.status === 'active')
          .slice(0, 2)
          .map(mapSimilarProperty);

        setSimilarProperties(similar);
        setSelectedImage(0);
        setCarouselOffset(0);
      } catch {
        setPropertyError("Unable to load property from database right now.");
        setSimilarProperties([]);
      } finally {
        setIsLoadingProperty(false);
      }
    };

    void loadProperty();
  }, [propertyId]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <Link to="/app/listings" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {isLoadingProperty && (
          <Card className="mb-6 p-4 text-sm text-blue-700 bg-blue-50 border-blue-200">
            Loading property details from database...
          </Card>
        )}

        {!isLoadingProperty && propertyError && (
          <Card className="mb-6 p-4 text-sm text-red-700 bg-red-50 border-red-200">
            {propertyError}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative group">
                <img
                  src={property.images[selectedImage]}
                  alt="Main"
                  className="w-full h-64 md:h-[500px] object-cover cursor-pointer"
                  onClick={() => {
                    setLightboxImage(selectedImage);
                    setShowLightbox(true);
                  }}
                />
                {/* Zoom Icon */}
                <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </div>
                {/* Verification Badge Overlay */}
                <div className="absolute top-4 left-4">
                  <Badge className={`${property.verificationStatus === 'VERIFIED' ? 'bg-green-500' : 'bg-yellow-600'} text-white flex items-center gap-2 px-4 py-2`}>
                    <Shield className="w-4 h-4" />
                    {property.verificationStatus}
                  </Badge>
                </div>
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    onClick={handleAddToFavourites}
                    aria-label="Add property to favourites"
                    title="Add property to favourites"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-50">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {property.images.length}
                </div>
              </div>
              
              {/* Thumbnail Carousel */}
              <div className="p-4 bg-gray-50 relative">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCarouselOffset(Math.max(0, carouselOffset - 1))}
                    disabled={carouselOffset === 0}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                      carouselOffset === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Thumbnails Container */}
                  <div className="flex-1 overflow-hidden">
                    <div 
                      className="flex gap-2 transition-transform duration-300"
                      style={{ transform: `translateX(-${carouselOffset * (100 / 4)}%)` }}
                    >
                      {property.images.map((image, idx) => (
                        <div
                          key={idx}
                          className="flex-shrink-0"
                          style={{ width: 'calc(25% - 6px)' }}
                        >
                          <div className="relative group/thumb">
                            <img
                              src={image}
                              alt={`View ${idx + 1}`}
                              className={`w-full h-16 md:h-20 object-cover rounded cursor-pointer border-2 transition-all ${
                                selectedImage === idx 
                                  ? "border-blue-500 ring-2 ring-blue-300" 
                                  : "border-transparent hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedImage(idx)}
                            />
                            {/* Hover overlay with zoom icon */}
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center rounded cursor-pointer"
                              onClick={() => {
                                setLightboxImage(idx);
                                setShowLightbox(true);
                              }}
                            >
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCarouselOffset(Math.min(property.images.length - 4, carouselOffset + 1))}
                    disabled={carouselOffset >= property.images.length - 4}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                      carouselOffset >= property.images.length - 4
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-semibold mb-2">{property.title}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </p>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{property.price}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">BEDROOMS</div>
                    <div className="font-semibold">{property.beds}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Bath className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">BATHROOMS</div>
                    <div className="font-semibold">{property.baths}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">PARKING</div>
                    <div className="font-semibold">{property.garage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Maximize className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">FLOOR AREA</div>
                    <div className="font-semibold">{property.floorArea} m²</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Listing Verification & Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verification Status */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Listing Verification</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className={`${property.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {property.verificationStatus || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Property Type</span>
                    <span className="font-medium text-sm capitalize">{property.propertyType || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Listing Status</span>
                    <span className="font-medium text-sm capitalize">{property.listingStatus || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="font-medium text-sm">{property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </Card>

              {/* Listing Timeline */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Listing Timeline</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">{property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium">{property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verification</span>
                    <span className="font-medium">{property.verificationStatus || 'UNKNOWN'}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Property Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Property Description</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm md:text-base">
                {property.description || "No description available for this listing."}
              </div>
            </Card>

            {/* Features & Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
              {property.features.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">{feature.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">No feature data available.</div>
              )}
            </Card>

            {/* Location */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Location</h2>
                <span className="text-sm text-blue-500">{property.address}</span>
              </div>
              <div className="bg-gray-200 rounded-lg h-64 md:h-80 flex items-center justify-center relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=300&fit=crop"
                  alt="Map"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-blue-500 text-white p-4 rounded-full">
                    <MapPinned className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Fraud Report Section */}
            <Card className="p-6 border-2 border-red-100">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Report Suspicious Activity</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us maintain marketplace integrity. If you notice anything suspicious about this listing, please report it.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowFraudReport(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Fraud or Issue
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Viewing Button - Prominent */}
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Calendar className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-xl mb-2">Schedule a Viewing</h3>
              <p className="text-blue-100 text-sm mb-4">
                {isSoldListing
                  ? "Viewing is unavailable because this property is sold"
                  : "Book a time to see this property in person"}
              </p>
              <Button
                className="w-full bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  if (!isSoldListing) {
                    setShowScheduleModal(true);
                  }
                }}
                disabled={isSoldListing}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isSoldListing ? "Unavailable" : "Schedule Now"}
              </Button>
            </Card>

            {/* Agent Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={property.agent.image}
                  alt={property.agent.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/agent-profile/${property.agent.id}?back=${encodeURIComponent(pathname || '/app/listings')}`}
                      className="font-semibold hover:text-blue-600 transition-colors"
                    >
                      {property.agent.name}
                    </Link>
                    {property.agent.verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{property.agent.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Trust Score: {property.agent.trustScore}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={inquiryName}
                    onChange={(event) => setInquiryName(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={inquiryEmail}
                    onChange={(event) => setInquiryEmail(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+27 00 000 0000"
                    value={inquiryPhone}
                    onChange={(event) => setInquiryPhone(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message</label>
                  <textarea
                    placeholder="I am interested in this property..."
                    rows={3}
                    value={inquiryMessage}
                    onChange={(event) => setInquiryMessage(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                {isSoldListing && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    This property is sold. New inquiries are disabled.
                  </div>
                )}
                {inquiryError && (
                  <div className="text-sm text-red-600">{inquiryError}</div>
                )}
                {inquirySuccess && (
                  <div className="text-sm text-green-600">{inquirySuccess}</div>
                )}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSubmitInquiry}
                  disabled={isSubmittingInquiry || isSoldListing}
                >
                  {isSubmittingInquiry ? "Sending..." : isSoldListing ? "Unavailable" : "Send Inquiry"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    disabled={isSoldListing}
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    disabled={isSoldListing}
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </Card>

            {/* Similar Properties */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Similar Properties</h3>
              <div className="space-y-4">
                {similarProperties.map((item) => (
                  <div key={`${item.title}-${item.location}`} className="flex gap-3 pb-4 border-b border-gray-200 last:border-0">
                    <img 
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-16 object-cover rounded"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PROPERTY_IMAGE;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link to={`/app/property/${item.id}`} className="font-medium text-sm truncate block hover:text-blue-600 transition-colors">
                        {item.title}
                      </Link>
                      <div className="text-xs text-gray-600 truncate">{item.location}</div>
                      <div className="font-bold text-blue-600 text-sm mt-1">{item.price}</div>
                    </div>
                  </div>
                ))}
                {similarProperties.length === 0 && (
                  <div className="text-sm text-gray-600">No similar properties available right now.</div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View More
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Fraud Report Modal */}
      {showFraudReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Report Suspicious Activity</h3>
              <button onClick={() => setShowFraudReport(false)} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Issue Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={fraudReportType}
                  onChange={(event) => setFraudReportType(event.target.value as typeof fraudReportType)}
                >
                  <option value="non_existent">Fake Listing</option>
                  <option value="misrepresentation">Price Manipulation / Misleading Information</option>
                  <option value="fake_title">Ownership or Title Issue</option>
                  <option value="double_sale">Double Sale</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  rows={4}
                  placeholder="Please provide details about the issue..."
                  value={fraudDescription}
                  onChange={(event) => setFraudDescription(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>
              {fraudError && <div className="text-sm text-red-600">{fraudError}</div>}
              {fraudSuccess && <div className="text-sm text-green-600">{fraudSuccess}</div>}
              <div className="flex gap-3">
                <Button onClick={() => setShowFraudReport(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSubmitFraudReport}
                  disabled={isSubmittingFraud}
                >
                  {isSubmittingFraud ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-xl">Schedule a Viewing</h3>
              </div>
              <button 
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleStep(1);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  4
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {scheduleError && <div className="text-sm text-red-600">{scheduleError}</div>}
              {scheduleSuccess && <div className="text-sm text-green-600">{scheduleSuccess}</div>}
              {/* Step 1: Select Viewing Type */}
              {scheduleStep === 1 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Choose Viewing Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${viewingType === "inPerson" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => setViewingType("inPerson")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="viewingType"
                          value="inPerson"
                          className="w-5 h-5 mt-1"
                          checked={viewingType === "inPerson"}
                          onChange={() => setViewingType("inPerson")}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">In-Person Viewing</span>
                          </div>
                          <p className="text-sm text-gray-600">Visit the property with the agent and explore every detail in person</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Duration: ~45 minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${viewingType === "virtual" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => setViewingType("virtual")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="viewingType"
                          value="virtual"
                          className="w-5 h-5 mt-1"
                          checked={viewingType === "virtual"}
                          onChange={() => setViewingType("virtual")}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold">Virtual Tour</span>
                          </div>
                          <p className="text-sm text-gray-600">Join a live video call with the agent for a virtual walkthrough</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Duration: ~30 minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {scheduleStep === 2 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Select Date & Time</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preferred Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preferred Time</label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        <option value="">Select time slot</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Available Time Slots</p>
                        <p className="text-blue-700">The agent typically responds within 2 hours to confirm your booking. You'll receive a confirmation email once approved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Your Details */}
              {scheduleStep === 3 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Your Contact Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={viewerName}
                        onChange={(e) => setViewerName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email Address *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={viewerEmail}
                          onChange={(e) => setViewerEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="+27 00 000 0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={viewerPhone}
                          onChange={(e) => setViewerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Special Requests (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Any specific areas you'd like to focus on during the viewing?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {scheduleStep === 4 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Review Your Booking</h4>
                    <p className="text-gray-600 text-sm">Please review the details before confirming</p>
                  </div>

                  <div className="space-y-4">
                    {/* Property Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-2">Property</h5>
                      <p className="text-sm">{property.title}</p>
                      <p className="text-sm text-gray-600">{property.address}</p>
                    </div>

                    {/* Viewing Details */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-3">Viewing Details</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type:</span>
                          <span className="text-sm font-medium flex items-center gap-1">
                            {viewingType === "inPerson" ? (
                              <><MapPin className="w-4 h-4" /> In-Person Viewing</>
                            ) : (
                              <><Video className="w-4 h-4" /> Virtual Tour</>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm font-medium">{selectedDate || "Not selected"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Time:</span>
                          <span className="text-sm font-medium">{selectedTime || "Not selected"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-3">Your Details</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium">{viewerName || "Not provided"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{viewerEmail || "Not provided"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="text-sm font-medium">{viewerPhone || "Not provided"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={property.agent.image}
                          alt={property.agent.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{property.agent.name}</p>
                          <p className="text-sm text-gray-600">{property.agent.title}</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-900 mt-3">
                        <strong>{property.agent.name}</strong> will contact you within 2 hours to confirm the viewing appointment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {scheduleStep > 1 && scheduleStep < 4 && (
                  <Button 
                    onClick={() => setScheduleStep(scheduleStep - 1)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                {scheduleStep < 4 && (
                  <Button 
                    onClick={() => setScheduleStep(scheduleStep + 1)} 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {scheduleStep === 4 && (
                  <Button 
                    onClick={handleConfirmViewing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled={isSubmittingSchedule}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isSubmittingSchedule ? "Submitting..." : "Confirm Booking"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Image Lightbox/Viewer Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm z-10">
            {lightboxImage + 1} / {property.images.length}
          </div>

          {/* Previous Button */}
          <button
            onClick={() => setLightboxImage((lightboxImage - 1 + property.images.length) % property.images.length)}
            className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={() => setLightboxImage((lightboxImage + 1) % property.images.length)}
            className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-16">
            <img
              src={property.images[lightboxImage].replace('w=400&h=300', 'w=1600&h=1200')}
              alt={`Property view ${lightboxImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 overflow-x-auto justify-center">
                {property.images.map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`w-16 h-12 md:w-20 md:h-16 object-cover rounded cursor-pointer flex-shrink-0 transition-all ${
                      lightboxImage === idx
                        ? 'border-2 border-white ring-2 ring-white/50 opacity-100'
                        : 'border-2 border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setLightboxImage(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-xs hidden md:block">
            Use ← → arrow keys to navigate • ESC to close
          </div>
        </div>
      )}
    </div>
  );
}