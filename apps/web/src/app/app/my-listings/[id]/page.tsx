'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Bed, Bath, Maximize, ArrowLeft, Bot, FileText, PhoneCall, Loader2,
  Home, Calendar, MessageSquare, DoorOpen, MessagesSquare, FolderOpen,
  ClipboardCheck, Star, StickyNote, Eye, Users, Tag, ShoppingBag, CheckSquare,
} from 'lucide-react';
import { OverflowTabBar, type TabItem } from '@/components/my-listings/OverflowTabBar';
import { ScheduledViewings } from '@/components/my-listings/ScheduledViewings';
import { ListingDetails } from '@/components/my-listings/ListingDetails';
import { Enquiries } from '@/components/my-listings/Enquiries';
import { OpenHouses } from '@/components/my-listings/OpenHouses';
import { PropertyCondition } from '@/components/my-listings/PropertyCondition';
import { SellingPoints } from '@/components/my-listings/SellingPoints';
import { Notes } from '@/components/my-listings/Notes';
import { Showings } from '@/components/my-listings/Showings';
import { Leads } from '@/components/my-listings/Leads';
import { Offers } from '@/components/my-listings/Offers';
import { SaleDetails } from '@/components/my-listings/SaleDetails';
import { PostSaleActivities } from '@/components/my-listings/PostSaleActivities';
import { Documents } from '@/components/my-listings/Documents';
import { CommunicationLog } from '@/components/my-listings/CommunicationLog';
import { AIAssistant } from '@/components/my-listings/AIAssistant';
import { ActivitySummary } from '@/components/my-listings/ActivitySummary';
import { propertiesApi, type PropertyListing, type PropertyStats } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';

const TAB_DEFS: Omit<TabItem, 'badge'>[] = [
  { value: 'details',    label: 'Listing Details',    icon: Home },
  { value: 'viewings',   label: 'Viewings',           icon: Calendar },
  { value: 'enquiries',  label: 'Enquiries',          icon: MessageSquare },
  { value: 'openhouses', label: 'Open Houses',        icon: DoorOpen },
  { value: 'comms',      label: 'Communications',     icon: MessagesSquare },
  { value: 'documents',  label: 'Documents',          icon: FolderOpen },
  { value: 'condition',  label: 'Condition',          icon: ClipboardCheck },
  { value: 'selling',    label: 'Selling Points',     icon: Star },
  { value: 'notes',      label: 'Notes',              icon: StickyNote },
  { value: 'showings',   label: 'Showings',           icon: Eye },
  { value: 'leads',      label: 'Leads',              icon: Users },
  { value: 'offers',     label: 'Offers',             icon: Tag },
  { value: 'sale',       label: 'Sale Details',       icon: ShoppingBag },
  { value: 'postsale',   label: 'Post-Sale',          icon: CheckSquare },
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listingId = params.id as string;
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'details');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const authToken = getAccessToken() ?? '';
  const user = getStoredUser();

  useEffect(() => {
    setIsLoading(true);
    setError('');

    Promise.all([
      propertiesApi.getById(listingId, authToken || undefined),
      authToken ? propertiesApi.getPropertyStats(authToken, listingId) : Promise.resolve(null),
    ])
      .then(([prop, propertyStats]) => {
        setProperty(prop);
        setStats(propertyStats);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load listing'))
      .finally(() => setIsLoading(false));
  }, [listingId, authToken]);

  const primaryImage =
    property?.media?.find((m) => m.is_primary)?.url ??
    property?.media?.[0]?.url ??
    'https://images.unsplash.com/photo-1706808849802-8f876ade0d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

  const address = property?.location?.address_line1 ?? property?.title ?? 'Address unavailable';
  const cityRegion = [property?.location?.city, property?.location?.region].filter(Boolean).join(', ');

  const agentName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Agent';
  const agentInitials = user ? getInitials(user.firstName, user.lastName) : 'AG';
  const agentCompany = user?.companyName ?? null;

  const daysOnMarket = property
    ? Math.max(0, Math.floor((Date.now() - new Date(property.created_at).getTime()) / 86_400_000))
    : 0;

  const tabBadges: Record<string, number> = stats
    ? {
        viewings: stats.viewings_requested,
        enquiries: stats.inquiries,
        openhouses: stats.open_houses_scheduled,
        documents: stats.documents_count,
        leads: stats.leads_count,
      }
    : {};

  const tabs: TabItem[] = useMemo(
    () => TAB_DEFS.map((t) => ({ ...t, badge: tabBadges[t.value] })),
    [stats], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/app/my-listings')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Listing Details</h1>
                <p className="text-sm text-gray-600">Manage your property listing</p>
              </div>
            </div>
            <button
              onClick={() => setIsAIOpen(!isAIOpen)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                isAIOpen
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:shadow-md hover:shadow-blue-100'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span className="text-sm font-medium">AI Assistant</span>
              <span className={`w-2 h-2 rounded-full ${isAIOpen ? 'bg-green-300' : 'bg-green-500 animate-pulse'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && property && (
          <>
            <ActivitySummary propertyId={listingId} authToken={authToken} onTabChange={(tab) => setActiveTab(tab)} />

            {/* Property Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Property Image */}
                <div className="relative h-80 md:h-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={primaryImage} alt={property.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium capitalize">
                      {property.status.replace('_', ' ')}
                    </span>
                    {property.listing_type && (
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium capitalize">
                        {property.listing_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Link
                      href={`/app/my-listings/${listingId}/edit`}
                      className="flex-1 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Edit Listing
                    </Link>
                    <button className="flex-1 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <PhoneCall className="w-4 h-4" />
                      Contact Seller
                    </button>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-3xl font-semibold text-gray-900 mb-2">
                      {formatMoney(property.price, property.currency)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>{address}</span>
                    </div>
                    {cityRegion && <div className="text-sm text-gray-500">{cityRegion}</div>}
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200 my-4">
                    <div className="flex items-center gap-2">
                      <Bed className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">{property.bedrooms ?? '—'}</div>
                        <div className="text-xs text-gray-500">Bedrooms</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">{property.bathrooms ?? '—'}</div>
                        <div className="text-xs text-gray-500">Bathrooms</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">
                          {property.area_sqm ? Number(property.area_sqm).toLocaleString() : '—'}
                        </div>
                        <div className="text-xs text-gray-500">m²</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {property.listing_reference && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ref #:</span>
                        <span className="font-medium">{property.listing_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Listed:</span>
                      <span className="font-medium">
                        {new Date(property.created_at).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days on Market:</span>
                      <span className="font-medium">{daysOnMarket} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium capitalize">{property.property_type.replace(/_/g, ' ')}</span>
                    </div>
                    {property.view_count !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Views:</span>
                        <span className="font-medium">{property.view_count}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Listed By</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                            {agentInitials}
                          </div>
                          <div>
                            <div className="font-medium">{agentName}</div>
                            {agentCompany && <div className="text-sm text-gray-500">{agentCompany}</div>}
                          </div>
                        </div>
                      </div>
                      {property.view_count !== undefined && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{property.view_count}</div>
                          <div className="text-[10px] text-gray-500">Views</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <OverflowTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="p-6">
                {activeTab === 'details'    && property && <ListingDetails property={property} />}
                {activeTab === 'viewings'   && <ScheduledViewings propertyId={listingId} authToken={authToken} />}
                {activeTab === 'enquiries'  && <Enquiries propertyId={listingId} authToken={authToken} property={property} />}
                {activeTab === 'openhouses' && <OpenHouses propertyId={listingId} authToken={authToken} propertyAddress={address} currentAgentName={agentName} />}
                {activeTab === 'comms'      && <CommunicationLog propertyId={listingId} authToken={authToken} property={property} />}
                {activeTab === 'documents'  && <Documents propertyId={listingId} authToken={authToken} />}
                {activeTab === 'condition'  && <PropertyCondition propertyId={listingId} authToken={authToken} />}
                {activeTab === 'selling'    && <SellingPoints propertyId={listingId} authToken={authToken} />}
                {activeTab === 'notes'      && <Notes propertyId={listingId} authToken={authToken} />}
                {activeTab === 'showings'   && <Showings propertyId={listingId} authToken={authToken} />}
                {activeTab === 'leads'      && <Leads propertyId={listingId} authToken={authToken} />}
                {activeTab === 'offers'     && <Offers propertyId={listingId} authToken={authToken} />}
                {activeTab === 'sale'       && <SaleDetails propertyId={listingId} authToken={authToken} />}
                {activeTab === 'postsale'   && <PostSaleActivities propertyId={listingId} authToken={authToken} />}
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Assistant */}
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      {/* Floating AI button for mobile */}
      {!isAIOpen && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-300/60 transition-all flex items-center justify-center z-40 md:hidden"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
