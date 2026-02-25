'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "@/lib/router-compat";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft, Shield, CheckCircle2, Star, MapPin, Phone, Mail, 
  MessageSquare, Award, TrendingUp, Home, Calendar, 
  Clock, Eye, ThumbsUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { propertiesApi, type AgentProfileResponse } from "@/lib/api-client";

const DEFAULT_AGENT_IMAGE = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop";
const DEFAULT_LISTING_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300&h=200&fit=crop";

function formatMoney(price: string, currency: string): string {
  const value = Number(price);
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toISOString().slice(0, 10);
}

function getYearsExperienceFromStatus(status: string): number {
  return status === "active" ? 5 : 0;
}

export default function AgentProfile() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [agentProfile, setAgentProfile] = useState<AgentProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const agentId = typeof id === "string" ? id : "";
  const backParam = searchParams.get('back');
  const isSafeBackPath = Boolean(backParam && backParam.startsWith('/') && !backParam.startsWith('//'));
  const backTo = isSafeBackPath && backParam ? backParam : '/app/listings';
  const backLabel = backTo.startsWith('/app/property/') ? 'Back to Property' : 'Back to Listings';

  useEffect(() => {
    if (!agentId) {
      setError("Invalid agent id.");
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const profile = await propertiesApi.getAgentProfile(agentId);
        setAgentProfile(profile);
      } catch {
        setAgentProfile(null);
        setError("Unable to load agent profile from database.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [agentId]);

  const trustScore = useMemo(() => {
    if (!agentProfile || agentProfile.totalListings === 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((agentProfile.verifiedListings / agentProfile.totalListings) * 100),
    );
  }, [agentProfile]);

  const recentListings = useMemo(
    () => agentProfile?.listings.slice(0, 3) ?? [],
    [agentProfile],
  );

  const activeListings = useMemo(
    () => (agentProfile?.listings ?? []).filter((listing) => listing.status === 'active'),
    [agentProfile],
  );

  const profileName = agentProfile
    ? `${agentProfile.firstName} ${agentProfile.lastName}`.trim()
    : "";
  const profileInitials = profileName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link to={backTo} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {isLoading && (
          <Card className="p-6 mb-6 text-sm text-blue-700 bg-blue-50 border-blue-200">
            Loading agent profile from database...
          </Card>
        )}

        {!isLoading && error && (
          <Card className="p-6 mb-6 text-sm text-red-700 bg-red-50 border-red-200">
            {error}
          </Card>
        )}

        {!isLoading && !error && agentProfile && (
          <>
        {/* Agent Header */}
        <Card className="p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Agent Image */}
            <div className="shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-blue-100 bg-blue-50 flex items-center justify-center text-3xl font-semibold text-blue-700">
                <UserAvatarContent
                  avatarUrl={agentProfile.avatarUrl || DEFAULT_AGENT_IMAGE}
                  initials={profileInitials}
                  alt={profileName}
                />
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{profileName}</h1>
                    {agentProfile.status === 'active' && (
                      <Badge className="bg-blue-500 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-1">Property Agent</p>
                  <p className="text-blue-600 font-medium mb-3">{agentProfile.primaryCity}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-600">Trust Score: {trustScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{agentProfile.verifiedListings}</span>
                      <span className="text-gray-600 text-sm">verified listings</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 md:min-w-50">
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
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">Property Listings</Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">Verified Transactions</Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">Client Advisory</Badge>
                </div>
              </div>

              {/* Bio */}
              <p className="text-gray-700 leading-relaxed">
                {profileName} is an active agent on PropertyOS with {agentProfile.totalListings} total listings and {agentProfile.verifiedListings} verified properties.
              </p>
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
                <div className="text-2xl font-bold">{agentProfile.totalListings}</div>
                <div className="text-xs text-gray-600">Total Listings</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{agentProfile.activeListings}</div>
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
                <div className="text-2xl font-bold">{getYearsExperienceFromStatus(agentProfile.status)}</div>
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
                <div className="text-xl font-bold">&lt; 24 hours</div>
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
                Recent Listings
              </h2>
              <div className="space-y-4">
                {recentListings.map((property) => (
                  <div key={property.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <img
                      src={property.media_url || DEFAULT_LISTING_IMAGE}
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
                        <span className="text-lg font-bold text-green-600">{formatMoney(property.price, property.currency)}</span>
                        <span className="text-xs text-gray-500">Listed: {formatDate(property.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentListings.length === 0 && (
                  <p className="text-sm text-gray-500">No listings yet.</p>
                )}
              </div>
            </Card>

            {/* Active Listings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                Active Listings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeListings.map((property) => (
                  <Link
                    key={property.id}
                    to={`/app/property/${property.id}`}
                    className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={property.media_url || DEFAULT_LISTING_IMAGE}
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
                        <span className="text-lg font-bold text-blue-600">{formatMoney(property.price, property.currency)}</span>
                        <span className="text-xs text-gray-500">
                          {property.bedrooms ?? 0} bed • {property.bathrooms ?? 0} bath
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {activeListings.length === 0 && (
                  <p className="text-sm text-gray-500">No active listings.</p>
                )}
              </div>
            </Card>

            {/* Client Reviews */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-purple-600" />
                Client Reviews
              </h2>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                Reviews are not available yet for this agent profile.
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Eye className="w-4 h-4 mr-2" />
                View All Reviews
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
                    <div className="font-medium">{agentProfile.phone || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600">Email</div>
                    <div className="font-medium text-sm">{agentProfile.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600">WhatsApp</div>
                    <div className="font-medium">{agentProfile.phone || 'Not provided'}</div>
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

            {/* Trust Badge */}
            <Card className="p-6 bg-linear-to-br from-green-50 to-blue-50 border-green-200">
              <div className="text-center">
                <Shield className="w-16 h-16 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Verified Agent</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This agent has been verified by PropertyOS and meets our strict trust and safety standards.
                </p>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Trust Score: {trustScore}%
                </Badge>
              </div>
            </Card>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
