// @ts-nocheck
"use client"
import { useState, useRef, useEffect } from 'react';
import { propertiesApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import {
  Upload,
  Image as ImageIcon,
  Grid3x3,
  List,
  Search,
  Filter,
  Download,
  Trash2,
  Star,
  StarOff,
  Tag,
  Sparkles,
  Check,
  X,
  MoreVertical,
  ZoomIn,
  Edit,
  Copy,
  ChevronDown,
} from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  size: string;
  uploadDate: string;
  tags: string[];
  isFavorite: boolean;
  dimensions: string;
  room?: string;
  property?: string;
  enhanced: boolean;
}

const availableTags = [
  'Exterior',
  'Interior',
  'Kitchen',
  'Living Room',
  'Bedroom',
  'Bathroom',
  'Garden',
  'Backyard',
  'Front View',
  'Master Suite',
  'Dining Room',
  'Office',
  'Garage',
];

export function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    propertiesApi.getMyListings(token)
      .then((res) => {
        const listings = res?.data ?? [];
        const items: MediaItem[] = listings.flatMap((l) =>
          (l.media ?? []).map((m) => ({
            id: m.id,
            url: m.url,
            name: m.url.split('/').pop()?.split('?')[0] ?? m.id,
            size: '—',
            uploadDate: '',
            tags: m.media_type === 'video' ? ['Video'] : m.is_primary ? ['Photo', 'Primary'] : ['Photo'],
            isFavorite: m.is_primary,
            dimensions: '—',
            property: l.title,
            enhanced: false,
          }))
        );
        setMedia(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [showTagModal, setShowTagModal] = useState(false);
  const [currentTaggingId, setCurrentTaggingId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showEnhancing, setShowEnhancing] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMedia = media.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterTag === 'all' || item.tags.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedMedia);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMedia(newSelected);
  };

  const toggleFavorite = (id: string) => {
    setMedia((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleEnhance = async (id: string) => {
    setShowEnhancing(id);
    // Simulate AI enhancement
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setMedia((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enhanced: true } : item))
    );
    setShowEnhancing(null);
  };

  const handleBulkEnhance = async () => {
    const ids = Array.from(selectedMedia);
    for (const id of ids) {
      await handleEnhance(id);
    }
    setSelectedMedia(new Set());
  };

  const handleAddTag = (id: string, tag: string) => {
    setMedia((prev) =>
      prev.map((item) =>
        item.id === id && !item.tags.includes(tag)
          ? { ...item, tags: [...item.tags, tag] }
          : item
      )
    );
  };

  const handleRemoveTag = (id: string, tag: string) => {
    setMedia((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, tags: item.tags.filter((t) => t !== tag) }
          : item
      )
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop
    console.log('Files dropped:', e.dataTransfer.files);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    setMedia((prev) => prev.filter((item) => !selectedMedia.has(item.id)));
    setSelectedMedia(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Media Library</h2>
          <p className="text-slate-600">
            {filteredMedia.length} {filteredMedia.length === 1 ? 'photo' : 'photos'}
            {selectedMedia.size > 0 && ` • ${selectedMedia.size} selected`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectedMedia.size > 0 && (
            <>
              <button
                onClick={handleBulkEnhance}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Enhance Selected
              </button>
              <button
                onClick={handleDelete}
                className="p-2 border border-slate-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-slate-600" />
              </button>
            </>
          )}
          <button
            onClick={handleFileSelect}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-slate-400 bg-slate-50 scale-[1.02]'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => console.log('Files selected:', e.target.files)}
        />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-900 font-medium mb-1">
          Drop photos here or click to upload
        </p>
        <p className="text-sm text-slate-500">
          Support for JPG, PNG, HEIC up to 10MB each
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent min-w-[160px]"
          >
            <option value="all">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* View Toggle */}
        <div className="flex border border-slate-200 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-900 font-medium mb-1">No media found</p>
          <p className="text-sm text-slate-500">Upload photos to your property listings to see them here</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <MediaGridItem
              key={item.id}
              item={item}
              isSelected={selectedMedia.has(item.id)}
              onToggleSelect={toggleSelect}
              onToggleFavorite={toggleFavorite}
              onEnhance={handleEnhance}
              onOpenTagModal={() => {
                setCurrentTaggingId(item.id);
                setShowTagModal(true);
              }}
              onRemoveTag={handleRemoveTag}
              isEnhancing={showEnhancing === item.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filteredMedia.map((item) => (
            <MediaListItem
              key={item.id}
              item={item}
              isSelected={selectedMedia.has(item.id)}
              onToggleSelect={toggleSelect}
              onToggleFavorite={toggleFavorite}
              onEnhance={handleEnhance}
              onOpenTagModal={() => {
                setCurrentTaggingId(item.id);
                setShowTagModal(true);
              }}
              onRemoveTag={handleRemoveTag}
              isEnhancing={showEnhancing === item.id}
            />
          ))}
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && currentTaggingId && (
        <TagModal
          item={media.find((m) => m.id === currentTaggingId)!}
          availableTags={availableTags}
          onAddTag={(tag) => handleAddTag(currentTaggingId, tag)}
          onRemoveTag={(tag) => handleRemoveTag(currentTaggingId, tag)}
          onClose={() => {
            setShowTagModal(false);
            setCurrentTaggingId(null);
          }}
        />
      )}
    </div>
  );
}

interface MediaItemProps {
  item: MediaItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEnhance: (id: string) => void;
  onOpenTagModal: () => void;
  onRemoveTag: (id: string, tag: string) => void;
  isEnhancing: boolean;
}

function MediaGridItem({
  item,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onEnhance,
  onOpenTagModal,
  onRemoveTag,
  isEnhancing,
}: MediaItemProps) {
  return (
    <div
      className={`group relative bg-white rounded-lg border-2 overflow-hidden transition-all ${
        isSelected ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Image */}
      <div className="aspect-video relative overflow-hidden bg-slate-100">
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Top Controls */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            <button
              onClick={() => onToggleSelect(item.id)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-slate-900 border-slate-900'
                  : 'bg-white/90 border-white/90 hover:bg-white'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </button>

            <button
              onClick={() => onToggleFavorite(item.id)}
              className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all"
            >
              {item.isFavorite ? (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
            <button className="flex-1 px-3 py-1.5 bg-white/90 hover:bg-white rounded text-xs font-medium text-slate-900 transition-colors flex items-center justify-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5" />
              View
            </button>
            <button className="p-1.5 bg-white/90 hover:bg-white rounded transition-colors">
              <Download className="w-4 h-4 text-slate-600" />
            </button>
            <button className="p-1.5 bg-white/90 hover:bg-white rounded transition-colors">
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Enhanced Badge */}
        {item.enhanced && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Enhanced
          </div>
        )}

        {/* Enhancing Overlay */}
        {isEnhancing && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-white text-sm font-medium">Enhancing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-medium text-slate-900 text-sm truncate mb-2">{item.name}</h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
              +{item.tags.length - 2}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTagModal}
            className="flex-1 px-3 py-1.5 border border-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Tag className="w-3 h-3" />
            Tags
          </button>
          {!item.enhanced && (
            <button
              onClick={() => onEnhance(item.id)}
              disabled={isEnhancing}
              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-xs font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              Enhance
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          {item.dimensions} • {item.size}
        </div>
      </div>
    </div>
  );
}

function MediaListItem({
  item,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onEnhance,
  onOpenTagModal,
  onRemoveTag,
  isEnhancing,
}: MediaItemProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleSelect(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isSelected
            ? 'bg-slate-900 border-slate-900'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Thumbnail */}
      <div className="w-20 h-14 rounded overflow-hidden bg-slate-100 flex-shrink-0 relative">
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
        {item.enhanced && (
          <div className="absolute top-1 right-1">
            <Sparkles className="w-3 h-3 text-white drop-shadow" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-slate-500">{item.room}</span>
          <span className="text-slate-300">•</span>
          <span className="text-sm text-slate-500">{item.dimensions}</span>
          <span className="text-slate-300">•</span>
          <span className="text-sm text-slate-500">{item.size}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 max-w-xs">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggleFavorite(item.id)}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
        >
          {item.isFavorite ? (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          ) : (
            <StarOff className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <button
          onClick={onOpenTagModal}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
        >
          <Tag className="w-4 h-4 text-slate-600" />
        </button>
        {!item.enhanced && (
          <button
            onClick={() => onEnhance(item.id)}
            disabled={isEnhancing}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-xs font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            {isEnhancing ? 'Enhancing...' : 'Enhance'}
          </button>
        )}
        <button className="p-2 hover:bg-slate-100 rounded transition-colors">
          <Download className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

function TagModal({
  item,
  availableTags,
  onAddTag,
  onRemoveTag,
  onClose,
}: {
  item: MediaItem;
  availableTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClose: () => void;
}) {
  const [customTag, setCustomTag] = useState('');

  const handleAddCustomTag = () => {
    if (customTag.trim() && !item.tags.includes(customTag.trim())) {
      onAddTag(customTag.trim());
      setCustomTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Manage Tags</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Image Preview */}
          <div className="mb-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm text-slate-600 mt-2">{item.name}</p>
          </div>

          {/* Current Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onRemoveTag(tag)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  {tag}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              {item.tags.length === 0 && (
                <p className="text-sm text-slate-500">No tags added yet</p>
              )}
            </div>
          </div>

          {/* Add Tag */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                placeholder="Type custom tag..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              />
              <button
                onClick={handleAddCustomTag}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
              >
                Add
              </button>
            </div>

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter((tag) => !item.tags.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onAddTag(tag)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-full text-sm hover:bg-slate-50 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
