import { useParams, Link } from "react-router";
import {
  ChevronLeft, Shield, CheckCircle2, Star, MapPin, Phone, Mail, 
  MessageSquare, Award, TrendingUp, Home, Users, Calendar, 
  Clock, Eye, ThumbsUp, BadgeCheck
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function AgentProfile() {
  const { id } = useParams();

  // Mock agent data - in real app, fetch based on id
  const agent = {
    id: id || "agent-001",
    name: "David Mitchell",
    title: "Senior Property Consultant",
    company: "Platinum Realty Group",
    verified: true,
    trustScore: 98,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    bio: "With over 15 years of experience in luxury real estate, David has helped hundreds of families find their dream homes across Cape Town. Specializing in coastal properties and high-end residential estates, he brings unparalleled market knowledge and a commitment to excellence in every transaction.",
    specializations: ["Luxury Homes", "Coastal Properties", "Investment Properties", "First-Time Buyers"],
    stats: {
      propertiesSold: 247,
      activeListings: 18,
      yearsExperience: 15,
      avgResponseTime: "< 2 hours",
      clientSatisfaction: 4.9,
      totalReviews: 156
    },
    contact: {
      phone: "+27 21 555 0123",
      email: "david.mitchell@platinumrealty.co.za",
      whatsapp: "+27 21 555 0123"
    },
    certifications: [
      { name: "Certified Property Practitioner", year: "2020" },
      { name: "Real Estate Investment Specialist", year: "2018" },
      { name: "Luxury Property Certification", year: "2016" }
    ],
    recentSales: [
      {
        id: 1,
        title: "Ocean View Villa",
        location: "Clifton, Cape Town",
        price: "R 18,900,000",
        soldDate: "2024-01-15",
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&h=200&fit=crop"
      },
      {
        id: 2,
        title: "Modern Penthouse",
        location: "Sea Point, Cape Town",
        price: "R 12,500,000",
        soldDate: "2023-12-20",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=200&fit=crop"
      },
      {
        id: 3,
        title: "Luxury Estate",
        location: "Constantia, Cape Town",
        price: "R 22,300,000",
        soldDate: "2023-11-08",
        image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=200&fit=crop"
      }
    ],
    activeListings: [
      {
        id: 4,
        title: "Contemporary Coastal Residence",
        location: "Sea Point, Cape Town",
        price: "R 12,500,000",
        beds: 4,
        baths: 3.5,
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300&h=200&fit=crop"
      },
      {
        id: 5,
        title: "Mountain View Estate",
        location: "Camps Bay, Cape Town",
        price: "R 15,800,000",
        beds: 5,
        baths: 4,
        image: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=300&h=200&fit=crop"
      }
    ],
    reviews: [
      {
        id: 1,
        author: "Sarah Johnson",
        rating: 5,
        date: "2024-01-20",
        comment: "David made our home buying experience seamless and stress-free. His knowledge of the Cape Town market is exceptional, and he went above and beyond to find us the perfect property."
      },
      {
        id: 2,
        author: "Michael Chen",
        rating: 5,
        date: "2023-12-15",
        comment: "Professional, responsive, and trustworthy. David helped us navigate a complex transaction and ensured everything went smoothly. Highly recommended!"
      },
      {
        id: 3,
        author: "Emma Williams",
        rating: 5,
        date: "2023-11-28",
        comment: "Outstanding service from start to finish. David's expertise in luxury properties and attention to detail made all the difference. We couldn't be happier with our new home."
      }
    ]
  };

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
        {/* Agent Header */}
        <Card className="p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Agent Image */}
            <div className="flex-shrink-0">
              <img
                src={agent.image}
                alt={agent.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-blue-100"
              />
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{agent.name}</h1>
                    {agent.verified && (
                      <Badge className="bg-blue-500 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-1">{agent.title}</p>
                  <p className="text-blue-600 font-medium mb-3">{agent.company}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-600">Trust Score: {agent.trustScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{agent.stats.clientSatisfaction}</span>
                      <span className="text-gray-600 text-sm">({agent.stats.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 md:min-w-[200px]">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Agent
                  </Button>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Call
                  </Button>
                </div>
              </div>

              {/* Specializations */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">SPECIALIZATIONS</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-700 leading-relaxed">{agent.bio}</p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Home className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{agent.stats.propertiesSold}</div>
                <div className="text-xs text-gray-600">Properties Sold</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{agent.stats.activeListings}</div>
                <div className="text-xs text-gray-600">Active Listings</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{agent.stats.yearsExperience}</div>
                <div className="text-xs text-gray-600">Years Experience</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{agent.stats.avgResponseTime}</div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Sales */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Recent Sales
              </h2>
              <div className="space-y-4">
                {agent.recentSales.map((property) => (
                  <div key={property.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-24 h-20 md:w-32 md:h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-bold text-green-600">{property.price}</span>
                        <span className="text-xs text-gray-500">Sold: {property.soldDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Listings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                Active Listings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.activeListings.map((property) => (
                  <Link
                    key={property.id}
                    to={`/property/${property.id}`}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">{property.price}</span>
                        <span className="text-xs text-gray-500">
                          {property.beds} bed • {property.baths} bath
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Client Reviews */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-purple-600" />
                Client Reviews
              </h2>
              <div className="space-y-4">
                {agent.reviews.map((review) => (
                  <div key={review.id} className="pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{review.author}</div>
                          <div className="text-xs text-gray-500">{review.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Eye className="w-4 h-4 mr-2" />
                View All {agent.stats.totalReviews} Reviews
              </Button>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600">Phone</div>
                    <div className="font-medium">{agent.contact.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600">Email</div>
                    <div className="font-medium text-sm">{agent.contact.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600">WhatsApp</div>
                    <div className="font-medium">{agent.contact.whatsapp}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button variant="outline" className="text-sm">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </div>
            </Card>

            {/* Certifications */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-600" />
                Certifications
              </h3>
              <div className="space-y-3">
                {agent.certifications.map((cert, idx) => (
                  <div key={idx} className="pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{cert.name}</div>
                        <div className="text-xs text-gray-500">Certified {cert.year}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trust Badge */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <div className="text-center">
                <Shield className="w-16 h-16 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Verified Agent</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This agent has been verified by PropertyOS and meets our strict trust and safety standards.
                </p>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Trust Score: {agent.trustScore}%
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
