import { useState } from "react";
import { X, Info, Image as ImageIcon, Upload, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface CreateListingProps {
  onClose: () => void;
}

export function CreateListing({ onClose }: CreateListingProps) {
  // Start with no pre-populated images — placeholder Unsplash URLs were removed
  // (external image dependencies break offline/restricted environments).
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <Card className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Create New Listing</h2>
            <p className="text-sm text-gray-600">Add a new property to the PropertyOS inventory</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close listing modal"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Media & Gallery
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location & Map
            </TabsTrigger>
            <TabsTrigger value="amenities" className="flex items-center gap-2">
              Amenities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="grid grid-cols-2 gap-8">
              {/* Property Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">PROPERTY DETAILS</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LISTING TITLE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Modern Villa with Sea View"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PROPERTY TYPE
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>House</option>
                          <option>Apartment</option>
                          <option>Villa</option>
                          <option>Condo</option>
                          <option>Land</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LISTING PRICE ($)
                        </label>
                        <input
                          type="text"
                          placeholder="850,000"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DESCRIPTION
                      </label>
                      <textarea
                        placeholder="Describe the property's unique selling points..."
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Map & Location */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">MAP & LOCATION</h3>

                  <div className="relative bg-gray-100 rounded-lg h-64 overflow-hidden mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop"
                      alt="Map"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 shadow-lg">
                        <MapPin className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">DRAG TO PIN LOCATION</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Start typing address..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LATITUDE
                      </label>
                      <input
                        type="text"
                        placeholder="-33.9249"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LONGITUDE
                      </label>
                      <input
                        type="text"
                        placeholder="18.4241"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">MEDIA & ASSETS</h3>
                <span className="text-sm text-gray-500">Max file size: 50MB</span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Drop photos or videos</p>
                  <p className="text-xs text-gray-500">OR CLICK TO BROWSE</p>
                </div>

                {/* Uploaded Images */}
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-border">
                    <img src={img} alt={`Uploaded property photo ${idx + 1}`} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        aria-label={`Remove photo ${idx + 1}`}
                        onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  💡 <strong>Pro Tip:</strong> Properties with 8+ high-quality photos receive 3x more
                  inquiries on average. Include exterior, interior, and amenity shots.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location">
            <div className="text-center py-12 text-gray-500">
              Location & Map content here...
            </div>
          </TabsContent>

          <TabsContent value="amenities">
            <div className="text-center py-12 text-gray-500">
              Amenities content here...
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="outline">Save as Draft</Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Publish Listing
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Plus icon component
function Plus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}