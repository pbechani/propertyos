// @ts-nocheck
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendees: number;
  views: number;
  price: string;
  type: string;
  agent: string;
}

interface PropertyGroup {
  key: string;
  address: string;
  city: string;
  state: string;
  price: string;
  views: number;
  items: Property[];
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  live: { label: 'Live Now', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' }
};

function groupByProperty(items: Property[]): PropertyGroup[] {
  const map = new Map<string, PropertyGroup>();
  for (const item of items) {
    const key = item.address;
    if (!map.has(key)) {
      map.set(key, { key, address: item.address, city: item.city, state: item.state, price: item.price, views: item.views, items: [] });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

export function PropertyListView({ properties = [], loading, error }: { properties?: Property[]; loading: boolean; error: string | null }) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-rose-500">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groups = groupByProperty(filteredProperties);
  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by address or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* View Toggle */}
        <div className="flex border border-slate-200 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">Filter Properties</h3>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200"
                  >
                    Status: {statusConfig[statusFilter as keyof typeof statusConfig].label}
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{groups.length}</span> {groups.length === 1 ? 'property' : 'properties'},{' '}
          <span className="font-medium text-slate-900">{filteredProperties.length}</span> open {filteredProperties.length === 1 ? 'house' : 'houses'}
        </p>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="flex items-center justify-center py-16 text-slate-400 bg-white rounded-lg border border-slate-200">
          <span className="text-sm">No open houses match the current filters</span>
        </div>
      )}

      {/* Content */}
      {groups.length > 0 && (
        viewMode === 'table' ? (
          <TableGroupView groups={groups} />
        ) : (
          <GridGroupView groups={groups} />
        )
      )}
    </div>
  );
}

function TableGroupView({ groups }: { groups: PropertyGroup[] }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <div key={group.key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggle(group.key)}
              className="w-full flex items-center gap-3 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-900">{group.address}</span>
                {(group.city || group.state) && (
                  <span className="ml-2 text-sm text-slate-500">
                    <MapPin className="inline w-3.5 h-3.5 mr-0.5" />
                    {[group.city, group.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {group.price && group.price !== '—' && (
                  <span className="ml-3 text-sm font-medium text-slate-700">{group.price}</span>
                )}
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {group.items.length} open {group.items.length === 1 ? 'house' : 'houses'}
              </span>
            </button>

            {/* Rows */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date &amp; Time</th>
                      <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Attendees</th>
                      <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.items.map((property) => (
                      <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-start gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-900">{new Date(property.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <p className="text-xs text-slate-500">{property.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[property.status].color}`}>
                            {statusConfig[property.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-900">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{property.attendees}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-900">
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span>{property.views}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View"
                              onClick={() => router.push(`/app/open-houses/events/${property.id}`)}
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="More">
                              <MoreVertical className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridGroupView({ groups }: { groups: PropertyGroup[] }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <div key={group.key}>
            {/* Group header */}
            <button
              onClick={() => toggle(group.key)}
              className="w-full flex items-center gap-2 px-1 py-2 mb-3 border-b border-slate-200 text-left hover:text-slate-600 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="font-semibold text-slate-900 flex-1">{group.address}</span>
              {(group.city || group.state) && (
                <span className="text-sm text-slate-500">
                  {[group.city, group.state].filter(Boolean).join(', ')}
                </span>
              )}
              {group.price && group.price !== '—' && (
                <span className="text-sm font-medium text-slate-700">{group.price}</span>
              )}
              <span className="text-xs text-slate-500 ml-2">
                {group.items.length} open {group.items.length === 1 ? 'house' : 'houses'}
              </span>
            </button>

            {/* Cards */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((property) => (
                  <div key={property.id} className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(property.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-slate-400">·</span>
                        <span>{property.time}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${statusConfig[property.status].color}`}>
                        {statusConfig[property.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900">{property.attendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900">{property.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                        onClick={() => router.push(`/app/open-houses/events/${property.id}`)}
                      >
                        View Details
                      </button>
                      <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
