'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Search,
  Filter,
  Download,
  Upload,
  X,
  Calendar,
  MapPin,
  User,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Share2,
  Tag
} from 'lucide-react';
import { mockSitePhotos } from '@/views/construction/data/siteMonitoring';
import type { SitePhoto } from '@/views/construction/types';

export function SitePhotoGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get unique values for filters
  const phases = Array.from(new Set(mockSitePhotos.map(p => p.phase)));
  const locations = Array.from(new Set(mockSitePhotos.map(p => p.location).filter(Boolean))) as string[];
  const dates = Array.from(new Set(mockSitePhotos.map(p => p.uploadDate))).sort().reverse();

  // Filter photos
  const filteredPhotos = mockSitePhotos.filter(photo => {
    const matchesSearch = 
      photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDate = dateFilter === 'all' || photo.uploadDate === dateFilter;
    const matchesPhase = phaseFilter === 'all' || photo.phase === phaseFilter;
    const matchesLocation = locationFilter === 'all' || photo.location === locationFilter;
    
    return matchesSearch && matchesDate && matchesPhase && matchesLocation;
  });

  const handlePhotoClick = (photo: SitePhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentPhotoIndex(index);
    setShowPreview(true);
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      const newIndex = currentPhotoIndex - 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < filteredPhotos.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevPhoto();
    if (e.key === 'ArrowRight') handleNextPhoto();
    if (e.key === 'Escape') setShowPreview(false);
  };

  const stats = {
    total: mockSitePhotos.length,
    thisWeek: mockSitePhotos.filter(p => {
      const photoDate = new Date(p.uploadDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return photoDate >= weekAgo;
    }).length,
    phases: phases.length,
    totalSize: mockSitePhotos.reduce((sum, p) => {
      const size = parseFloat(p.fileSize);
      return sum + size;
    }, 0).toFixed(1)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Photo Gallery</h1>
          <p className="text-gray-500 mt-1">View and manage construction site photography</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Selected
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">{stats.thisWeek}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Project Phases</p>
                <p className="text-2xl font-bold text-purple-600">{stats.phases}</p>
              </div>
              <Tag className="w-8 h-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Storage</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalSize} MB</p>
              </div>
              <ImageIcon className="w-8 h-8 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search photos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {dates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Phase Filter */}
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(dateFilter !== 'all' || phaseFilter !== 'all' || locationFilter !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Date: {new Date(dateFilter).toLocaleDateString()}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setDateFilter('all')} />
                </Badge>
              )}
              {phaseFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Phase: {phaseFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPhaseFilter('all')} />
                </Badge>
              )}
              {locationFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {locationFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setLocationFilter('all')} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('all');
                  setPhaseFilter('all');
                  setLocationFilter('all');
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Photos ({filteredPhotos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No photos found matching your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative cursor-pointer rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-all duration-200"
                  onClick={() => handlePhotoClick(photo, index)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={photo.url}
                      alt={photo.description || photo.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-sm font-medium truncate">
                          {photo.description || photo.fileName}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="w-8 h-8">
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="text-xs">{photo.phase}</Badge>
                      <span className="text-xs text-gray-500">{photo.fileSize}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {photo.location || 'No location'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(photo.uploadDate).toLocaleDateString()} • {photo.uploadedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent 
          className="max-w-6xl max-h-[95vh] p-0"
          onKeyDown={handleKeyDown}
        >
          {selectedPhoto && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {selectedPhoto.description || selectedPhoto.fileName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Photo {currentPhotoIndex + 1} of {filteredPhotos.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Image and Details */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
                {/* Image */}
                <div className="lg:col-span-2 relative bg-black flex items-center justify-center">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.description || selectedPhoto.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Navigation Arrows */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full"
                    onClick={handlePrevPhoto}
                    disabled={currentPhotoIndex === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full"
                    onClick={handleNextPhoto}
                    disabled={currentPhotoIndex === filteredPhotos.length - 1}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Details Panel */}
                <div className="bg-gray-50 p-6 overflow-y-auto">
                  <h4 className="font-semibold mb-4">Photo Details</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">
                        {selectedPhoto.description || 'No description'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Project</p>
                      <p className="text-sm text-gray-900">{selectedPhoto.projectName}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phase</p>
                      <Badge>{selectedPhoto.phase}</Badge>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedPhoto.location || 'No location'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Upload Date</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(selectedPhoto.uploadDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Uploaded By</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {selectedPhoto.uploadedBy}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">File Name</p>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {selectedPhoto.fileName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">File Size</p>
                        <p className="text-sm text-gray-900">{selectedPhoto.fileSize}</p>
                      </div>
                      {selectedPhoto.dimensions && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Dimensions</p>
                          <p className="text-sm text-gray-900">
                            {selectedPhoto.dimensions.width} × {selectedPhoto.dimensions.height}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedPhoto.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedPhoto.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
