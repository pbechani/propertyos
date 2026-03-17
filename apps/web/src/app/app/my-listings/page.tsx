'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  Eye,
  MessageSquare,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Bed,
  Bath,
  Maximize,
  ArrowUpRight,
  Clock,
  Copy,
  Share2,
  MapPin,
  Loader2,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/my-listings/ImageWithFallback';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { propertiesApi, type PropertyListing, type AgentDashboardResponse, type AgentListingPerformanceRow } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';

interface ListingCard {
  id: string;
  address: string;
  city: string;
  region: string;
  price: string;
  currency: string;
  beds: number;
  baths: number;
  sqm: number;
  status: 'active' | 'pending' | 'under-contract' | 'sold';
  listingType: 'for-sale' | 'rent' | 'development';
  imageUrl: string;
  daysOnMarket: number;
  viewCount: number;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1706808849802-8f876ade0d1f?w=800';

function mapApiStatus(status: string): ListingCard['status'] {
  switch (status) {
    case 'active': return 'active';
    case 'under_offer': return 'under-contract';
    case 'sold': return 'sold';
    default: return 'pending';
  }
}

function mapListingType(t: string | null | undefined): ListingCard['listingType'] {
  switch (t) {
    case 'for_sale': return 'for-sale';
    case 'to_rent': return 'rent';
    case 'development': return 'development';
    default: return 'for-sale';
  }
}

function mapToCard(p: PropertyListing): ListingCard {
  const primaryImage = p.media?.find((m) => m.is_primary)?.url ?? p.media?.[0]?.url ?? DEFAULT_IMAGE;
  const daysOnMarket = Math.max(0, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86_400_000));

  return {
    id: p.id,
    address: p.location?.address_line1 ?? p.title,
    city: p.location?.city ?? '',
    region: p.location?.region ?? '',
    price: p.price,
    currency: p.currency,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    sqm: p.area_sqm ? Number(p.area_sqm) : 0,
    status: mapApiStatus(p.status),
    listingType: mapListingType(p.listing_type),
    imageUrl: primaryImage,
    daysOnMarket,
    viewCount: p.view_count ?? 0,
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'under-contract': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'sold': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getListingTypeConfig(listingType: string) {
  switch (listingType) {
    case 'for-sale': return { label: 'FOR SALE', bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700', textColor: 'text-white' };
    case 'rent': return { label: 'FOR RENT', bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700', textColor: 'text-white' };
    case 'development': return { label: 'DEVELOPMENT', bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700', textColor: 'text-white' };
    default: return { label: 'FOR SALE', bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700', textColor: 'text-white' };
  }
}

export default function MyListingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allListings, setAllListings] = useState<ListingCard[]>([]);
  const [dashboard, setDashboard] = useState<AgentDashboardResponse | null>(null);
  const [performance, setPerformance] = useState<AgentListingPerformanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    Promise.all([
      propertiesApi.getMyListings(token),
      propertiesApi.getAgentDashboard(token),
      propertiesApi.getAgentListingsPerformance(token),
    ])
      .then(([listingsRes, dashboardRes, perfRes]) => {
        setAllListings(listingsRes.data.map(mapToCard));
        setDashboard(dashboardRes);
        setPerformance(Array.isArray(perfRes) ? perfRes : []);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load listings'))
      .finally(() => setIsLoading(false));
  }, []);

  const listings = statusFilter === 'all'
    ? allListings
    : allListings.filter((l) => {
        if (statusFilter === 'active') return l.status === 'active';
        if (statusFilter === 'under_offer') return l.status === 'under-contract';
        return l.status === statusFilter;
      });

  const filteredListings = listings.filter(
    (l) =>
      l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = allListings.filter((l) => l.status === 'active').length;

  // Aggregate totals from the performance endpoint (covers all-time, per-listing)
  const totalViews = performance.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalEnquiries = performance.reduce((s, r) => s + (r.inquiries ?? 0), 0);
  const totalSaves = performance.reduce((s, r) => s + (r.saves ?? 0), 0);

  const stats = [
    {
      label: 'Total Listings',
      value: String(allListings.length),
      change: `${activeCount} active`,
      trend: 'up' as const,
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Views',
      value: performance.length > 0 ? String(totalViews) : (dashboard ? String(dashboard.listingViewsLast7d) : '—'),
      change: dashboard
        ? `${(dashboard.listingViewsTrendPct ?? 0) >= 0 ? '+' : ''}${(dashboard.listingViewsTrendPct ?? 0).toFixed(0)}% vs prior 7 days`
        : `${totalSaves} saved`,
      trend: (dashboard?.listingViewsTrendPct ?? 0) >= 0 ? ('up' as const) : ('neutral' as const),
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Enquiries',
      value: performance.length > 0 ? String(totalEnquiries) : (dashboard ? String(dashboard.newInquiries7d) : '—'),
      change: dashboard
        ? `${dashboard.newInquiries7d} in last 7 days`
        : 'all time',
      trend: 'neutral' as const,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Response Rate',
      value: dashboard ? `${(dashboard.inquiryResponseRatePct ?? 0).toFixed(0)}%` : '—',
      change: 'inquiry response rate',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all your property listings</p>
        </div>
        <button
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          onClick={() => router.push('/app/my-listings/new')}
        >
          <Plus className="w-5 h-5" />
          Add New Listing
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-2">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="under_offer">Under Offer</option>
              <option value="sold">Sold</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Properties Grid */}
      {!isLoading && !error && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const typeConfig = getListingTypeConfig(listing.listingType);
            return (
              <div
                key={listing.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/app/my-listings/${listing.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={listing.imageUrl}
                    alt={listing.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(listing.status)}`}>
                      {listing.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-700" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
                          sideOffset={5}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none">
                            <Copy className="w-4 h-4" />
                            <span>Duplicate</span>
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none">
                            <Share2 className="w-4 h-4" />
                            <span>Share to Syndicates</span>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 ${typeConfig.bgColor} py-2 px-4`}>
                    <div className={`text-xs font-bold tracking-wide text-center ${typeConfig.textColor}`}>{typeConfig.label}</div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-2xl font-semibold text-gray-900 mb-2">
                    {formatMoney(listing.price, listing.currency)}
                  </div>
                  <div className="flex items-start gap-1 text-gray-700 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{listing.address}</div>
                      {listing.city && (
                        <div className="text-sm text-gray-600">
                          {[listing.city, listing.region].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {listing.beds} beds
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {listing.baths} baths
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" /> {listing.sqm.toLocaleString()} m²
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {listing.daysOnMarket} days on market
                    </span>
                    <span className="text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Details <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredListings.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {allListings.length > 0
              ? "Try adjusting your search or filter to find what you're looking for."
              : "You don't have any listings yet. Add your first property listing!"}
          </p>
          {allListings.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}
