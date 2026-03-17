'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/lib/router-compat';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  DollarSign,
  Package,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Building2,
  Star,
  History
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'contractor' | 'document' | 'invoice' | 'material' | 'risk' | 'change-order';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  statusColor?: string;
  url: string;
  tags?: string[];
  relevance: number;
}

const searchIndex: SearchResult[] = [
  // Projects
  { id: 'p1', type: 'project', title: 'Tower A - Luxury Residential', subtitle: 'Downtown Manhattan, NY', description: '63% complete · Structural Completion phase · $45M budget', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/projects/p1', tags: ['residential', 'high-rise', 'manhattan', 'luxury'], relevance: 100 },
  { id: 'p2', type: 'project', title: 'Riverside Commercial Complex', subtitle: 'Brooklyn, NY', description: '58% complete · MEP Installation phase · $32M budget', status: 'Delayed', statusColor: 'bg-red-100 text-red-700', url: '/projects/p2', tags: ['commercial', 'office', 'brooklyn'], relevance: 95 },
  { id: 'p3', type: 'project', title: 'GreenTech Industrial Park', subtitle: 'Newark, NJ', description: '23% complete · Foundation Work phase · $67M budget', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/projects/p3', tags: ['industrial', 'newark', 'greentech'], relevance: 90 },
  { id: 'p4', type: 'project', title: 'Lakeside Shopping Center', subtitle: 'Queens, NY', description: '8% complete · Planning & Permits phase · $28M budget', status: 'Planning', statusColor: 'bg-blue-100 text-blue-700', url: '/projects/p4', tags: ['retail', 'shopping', 'queens'], relevance: 85 },
  // Tasks
  { id: 't1', type: 'task', title: 'Complete Level 15 Concrete Pour', subtitle: 'Tower A · BuildTech Construction', description: 'Pour concrete for level 15 structural slab · 65% progress', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700', url: '/tasks/t1', tags: ['concrete', 'structural', 'level 15'], relevance: 88 },
  { id: 't2', type: 'task', title: 'Install MEP Risers (Levels 10-15)', subtitle: 'Tower A · ABC Mechanical', description: 'Mechanical, electrical, and plumbing vertical risers', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700', url: '/tasks/t2', tags: ['mep', 'mechanical', 'electrical', 'plumbing'], relevance: 82 },
  { id: 't3', type: 'task', title: 'Facade Installation - South Elevation', subtitle: 'Tower A · GlassTech Solutions', description: 'Glass curtain wall on south side', status: 'Todo', statusColor: 'bg-gray-100 text-gray-700', url: '/tasks/t3', tags: ['facade', 'curtain wall', 'glass'], relevance: 78 },
  { id: 't4', type: 'task', title: 'Roof Waterproofing', subtitle: 'Riverside Complex · ProRoof Systems', description: 'Waterproofing membrane for entire roof surface', status: 'Blocked', statusColor: 'bg-red-100 text-red-700', url: '/tasks/t4', tags: ['roofing', 'waterproofing'], relevance: 92 },
  { id: 't5', type: 'task', title: 'HVAC System Installation', subtitle: 'Riverside Complex · CoolAir HVAC', description: 'Full HVAC system for floors 1-8', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700', url: '/tasks', tags: ['hvac', 'mechanical', 'installation'], relevance: 75 },
  // Contractors
  { id: 'c1', type: 'contractor', title: 'BuildTech Construction', subtitle: 'General Contractor · Rating: 4.8/5', description: '15 projects completed · 3 active · License: NYC-GC-2024-1892', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/contractors/c1', tags: ['general contractor', 'buildtech'], relevance: 85 },
  { id: 'c2', type: 'contractor', title: 'ABC Mechanical', subtitle: 'Mechanical Contractor · Rating: 4.5/5', description: 'HVAC, plumbing, fire protection specialist', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/contractors', tags: ['mechanical', 'hvac', 'plumbing'], relevance: 80 },
  { id: 'c3', type: 'contractor', title: 'GlassTech Solutions', subtitle: 'Facade Specialist · Rating: 4.7/5', description: 'Curtain wall, glazing, facade engineering', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/contractors', tags: ['glass', 'facade', 'curtain wall'], relevance: 77 },
  { id: 'c4', type: 'contractor', title: 'ProRoof Systems', subtitle: 'Roofing Contractor · Rating: 4.2/5', description: 'Commercial and industrial roofing', status: 'Active', statusColor: 'bg-green-100 text-green-700', url: '/contractors', tags: ['roofing', 'waterproofing'], relevance: 73 },
  // Documents
  { id: 'd1', type: 'document', title: 'Structural Plans - Level 16-20 Rev C', subtitle: 'Tower A · Approved · PDF', description: 'Approved by structural engineering team on March 11', status: 'Approved', statusColor: 'bg-green-100 text-green-700', url: '/document-management', tags: ['structural', 'plans', 'engineering'], relevance: 70 },
  { id: 'd2', type: 'document', title: 'MEP Coordination Drawings', subtitle: 'Riverside Complex · Under Review · DWG', description: 'Mechanical/electrical coordination for floors 5-8', status: 'Under Review', statusColor: 'bg-amber-100 text-amber-700', url: '/document-management', tags: ['mep', 'drawings', 'coordination'], relevance: 68 },
  { id: 'd3', type: 'document', title: 'Fire Safety Compliance Report', subtitle: 'GreenTech Park · Approved · PDF', description: 'Annual fire safety compliance documentation', status: 'Approved', statusColor: 'bg-green-100 text-green-700', url: '/document-management', tags: ['safety', 'fire', 'compliance', 'report'], relevance: 65 },
  // Invoices
  { id: 'i1', type: 'invoice', title: 'INV-2026-0089 - BuildTech Construction', subtitle: 'Tower A · $245,000 · Paid', description: 'Progress payment for structural work levels 12-14', status: 'Paid', statusColor: 'bg-green-100 text-green-700', url: '/invoices', tags: ['invoice', 'buildtech', 'payment'], relevance: 60 },
  { id: 'i2', type: 'invoice', title: 'INV-2026-0092 - SteelCorp Industries', subtitle: 'Tower A · $182,500 · Pending', description: 'Steel rebar delivery for level 15-18', status: 'Pending', statusColor: 'bg-amber-100 text-amber-700', url: '/invoices', tags: ['invoice', 'steel', 'materials'], relevance: 58 },
  // Materials
  { id: 'm1', type: 'material', title: 'Steel Rebar #8', subtitle: 'Tower A · SteelCorp · In Transit', description: '50 tons ordered, expected delivery March 13', status: 'In Transit', statusColor: 'bg-blue-100 text-blue-700', url: '/inventory', tags: ['steel', 'rebar', 'structural'], relevance: 72 },
  { id: 'm2', type: 'material', title: 'Portland Cement Type II', subtitle: 'Tower A · ConcretePro · Low Stock', description: '300 bags remaining (15%), reorder triggered', status: 'Low Stock', statusColor: 'bg-amber-100 text-amber-700', url: '/inventory', tags: ['cement', 'concrete', 'material'], relevance: 76 },
  // Risks
  { id: 'r1', type: 'risk', title: 'Steel Supply Shortage Risk', subtitle: 'Tower A · High Severity', description: 'Global supply chain disruptions may affect steel deliveries for Q2 2026', status: 'Monitoring', statusColor: 'bg-amber-100 text-amber-700', url: '/risks', tags: ['supply chain', 'steel', 'procurement'], relevance: 82 },
  { id: 'r2', type: 'risk', title: 'Weather Delay Risk - March', subtitle: 'Tower A · Medium Severity', description: '70% chance of heavy rain March 15-17 impacting outdoor work', status: 'Identified', statusColor: 'bg-yellow-100 text-yellow-700', url: '/risks', tags: ['weather', 'delay', 'schedule'], relevance: 79 },
  // Change Orders
  { id: 'co1', type: 'change-order', title: 'CO-2026-001: Additional Fire Stairs', subtitle: 'Tower A · +$85,000 · +12 days', description: 'Code compliance requirement for additional fire stairwell on east wing', status: 'Approved', statusColor: 'bg-green-100 text-green-700', url: '/change-orders', tags: ['fire safety', 'code', 'structural'], relevance: 66 },
];

const typeIcons: Record<string, React.ElementType> = {
  project: FolderKanban,
  task: CheckSquare,
  contractor: Users,
  document: FileText,
  invoice: DollarSign,
  material: Package,
  risk: AlertTriangle,
  'change-order': TrendingUp,
};

const typeLabels: Record<string, string> = {
  project: 'Projects',
  task: 'Tasks',
  contractor: 'Contractors',
  document: 'Documents',
  invoice: 'Invoices',
  material: 'Materials',
  risk: 'Risks',
  'change-order': 'Change Orders',
};

const recentSearches = [
  'concrete pour tower A',
  'BuildTech invoice',
  'steel rebar delivery',
  'roof waterproofing riverside',
  'safety inspection overdue',
];

const savedSearches = [
  { query: 'All delayed tasks', filters: 'type:task status:blocked' },
  { query: 'High risk items', filters: 'type:risk severity:high' },
  { query: 'Pending invoices over $100K', filters: 'type:invoice status:pending' },
];

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return searchIndex
      .filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesType = activeType === 'all' || item.type === activeType;
        return matchesQuery && matchesType;
      })
      .sort((a, b) => b.relevance - a.relevance);
  }, [query, activeType]);

  const resultsByType = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });
    return grouped;
  }, [results]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    results.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [results]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          Global Search
        </h1>
        <p className="text-gray-500 mt-1">Search across all projects, tasks, contractors, documents, and more</p>
      </div>

      {/* Search Input */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects, tasks, contractors, documents, invoices, materials..."
              className="pl-12 pr-10 h-12 text-base"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {hasQuery && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Button
                variant={activeType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveType('all')}
              >
                All ({results.length})
              </Button>
              {Object.entries(typeLabels).map(([key, label]) => {
                const count = typeCounts[key] || 0;
                if (count === 0) return null;
                const Icon = typeIcons[key];
                return (
                  <Button
                    key={key}
                    variant={activeType === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveType(key)}
                  >
                    <Icon className="w-3 h-3 mr-1" />{label} ({count})
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No query - show recent & saved searches */}
      {!hasQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" /> Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentSearches.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{s}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400 ml-auto" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Saved Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {savedSearches.map(s => (
                <button
                  key={s.query}
                  onClick={() => setQuery(s.query)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-sm text-gray-700">{s.query}</span>
                    <p className="text-xs text-gray-400">{s.filters}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-400 ml-auto" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick access */}
          <Card className="border-0 shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> AI-Powered Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Overdue Tasks', count: 2, icon: CheckSquare, color: 'text-red-600 bg-red-50', query: 'blocked' },
                  { label: 'Pending Invoices', count: 3, icon: DollarSign, color: 'text-amber-600 bg-amber-50', query: 'pending invoice' },
                  { label: 'Active Risks', count: 5, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50', query: 'risk' },
                  { label: 'Delayed Projects', count: 1, icon: Building2, color: 'text-purple-600 bg-purple-50', query: 'delayed' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => setQuery(item.query)}
                    className="p-4 rounded-xl border hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-gray-900">{item.label}</p>
                    <p className="text-2xl text-gray-900 mt-1">{item.count}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results */}
      {hasQuery && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No results found for "{query}"</p>
                <p className="text-sm text-gray-400 mt-1">Try different keywords or check the spelling</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{results.length} results found</p>
              </div>
              {(activeType === 'all' ? Object.entries(resultsByType) : [[activeType, results]]).map(([type, items]) => {
                const typeKey = type as string;
                const Icon = typeIcons[typeKey];
                return (
                  <div key={typeKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <h3 className="text-sm text-gray-500">{typeLabels[typeKey]}</h3>
                      <Badge variant="outline" className="text-xs">{(items as SearchResult[]).length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {(items as SearchResult[]).map(result => {
                        const ResultIcon = typeIcons[result.type];
                        return (
                          <Link key={result.id} to={result.url}>
                            <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ResultIcon className="w-5 h-5 text-gray-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm text-gray-900">{result.title}</h4>
                                      {result.status && (
                                        <Badge className={`text-xs ${result.statusColor}`}>{result.status}</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
                                    {result.description && (
                                      <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                                    )}
                                    {result.tags && (
                                      <div className="flex gap-1 mt-2 flex-wrap">
                                        {result.tags.slice(0, 4).map(tag => (
                                          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}