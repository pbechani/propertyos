'use client';

import { Link } from "@/lib/router-compat";
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { buildSinglePointMapSource } from "@/lib/map-utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export default function PropertyDetail() {
  const property = {
    title: "Contemporary Coastal Residence",
    address: "4.2 Beach Road, Sea Point, Cape Town, 8005",
    latitude: -33.9154,
    longitude: 18.3897,
    price: "R 12,500,000",
    beds: 4,
    baths: 3.5,
    garage: 2,
    floorArea: 280,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&h=300&fit=crop",
    ],
    description: `This exquisite contemporary residence in the heart of Sea Point offers an unparalleled coastal lifestyle. Designed with meticulous attention to detail, the property features expansive open-plan living areas that flow seamlessly onto a large terrace with breathtaking Atlantic Ocean views.

The state-of-the-art kitchen is equipped with integrated high-end appliances and a separate scullery. Each of the four bedrooms is generously sized, with the primary suite boasting a private balcony, walk-in dressing room, and a luxurious en-suite bathroom.

Perfect for entertaining, the home includes a dedicated media room and an automated smart home system controlling lighting, security, and climate across all levels.`,
    features: [
      { label: "Air Conditioning", icon: true },
      { label: "Swimming Pool", icon: true },
      { label: "Security System", icon: true },
      { label: "Fiber Internet", icon: true },
      { label: "Pet Friendly", icon: true },
      { label: "Gym", icon: true },
    ],
    agent: {
      name: "David Mitchell",
      title: "Platinum Realty Group",
      verified: true,
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
    },
    marketInsight: {
      increase: "8.5%",
      period: "last 12 months",
      competitive: true,
    },
  };
  const agentInitials = property.agent.name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';
  const locationMapSource = buildSinglePointMapSource({
    latitude: property.latitude,
    longitude: property.longitude,
    mapboxToken: MAPBOX_TOKEN,
  });

  return (
    <div className="bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link to="/app/listings" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 row-span-2">
                <img
                  src={property.images[0]}
                  alt="Main"
                  className="w-full h-100 object-cover rounded-lg"
                />
              </div>
              {property.images.slice(1).map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`View ${idx + 2}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>

            {/* Property Details */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-semibold mb-2">{property.title}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Save property"
                    aria-label="Save property"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Share property"
                    aria-label="Share property"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-3xl font-bold text-blue-600 mb-6">{property.price}</div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">BEDROOMS</div>
                    <div className="font-semibold">{property.beds} Bedrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Bath className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">BATHROOMS</div>
                    <div className="font-semibold">{property.baths} Baths</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">PARKING</div>
                    <div className="font-semibold">{property.garage} Garage</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Maximize className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">FLOOR AREA</div>
                    <div className="font-semibold">{property.floorArea} m²</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Property Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Property Description</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {property.description}
              </div>
              <button className="text-blue-500 mt-3 text-sm hover:underline">
                Read more description
              </button>
            </Card>

            {/* Features & Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
              <div className="grid grid-cols-3 gap-4">
                {property.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Location */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Location</h2>
                <Link to="#" className="text-blue-500 text-sm hover:underline">
                  Sea Point, Cape Town
                </Link>
              </div>
              <div className="bg-gray-200 rounded-lg h-64 overflow-hidden border border-gray-200">
                {locationMapSource.type === 'image' ? (
                  <img
                    src={locationMapSource.url}
                    alt="Property location map"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    title="Property location map"
                    src={locationMapSource.url}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                  <UserAvatarContent
                    avatarUrl={property.agent.image}
                    initials={agentInitials}
                    alt={property.agent.name}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{property.agent.name}</h3>
                    {property.agent.verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{property.agent.title}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+27 00 000 0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message</label>
                  <textarea
                    placeholder="I am interested in this property..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Send Inquiry
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </Card>

            {/* Market Insight */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Market Insight</h3>
              <p className="text-sm text-gray-600 mb-3">
                Properties in Sea Point have seen a{" "}
                <span className="font-semibold text-green-600">{property.marketInsight.increase}</span>{" "}
                increase in value over the {property.marketInsight.period}. This listing is priced{" "}
                {property.marketInsight.competitive ? "competitively" : "above average"} for the area.
              </p>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Similar properties typically receive 12-18 inquiries within the first week of
                  listing.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}