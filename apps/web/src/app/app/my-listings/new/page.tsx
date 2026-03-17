'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Plus,
  Home,
  DollarSign,
  MapPin,
  FileText,
  Image as ImageIcon,
  Settings,
  Eye,
  Sparkles,
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';

export default function NewListingPage() {
  const router = useRouter();

  const [listingStatus, setListingStatus] = useState('active');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [propertyType, setPropertyType] = useState('single-family');
  const [mlsNumber, setMlsNumber] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  const handleSave = () => {
    router.push('/app/my-listings');
  };

  const handleCancel = () => {
    router.push('/app/my-listings');
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Create New Listing</h1>
                <p className="text-sm text-gray-600">Add a new property to your portfolio</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" /> Create Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Home className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">Basic Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="single-family">Single Family Home</option>
                      <option value="condo">Condominium</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="multi-family">Multi-Family</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MLS Number</label>
                    <input type="text" value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. SR24087523" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold">Pricing</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">List Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="text" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="825000" />
                  </div>
                  {price && <p className="mt-1 text-sm text-gray-500">${parseInt(price).toLocaleString()}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price/Sq Ft</label>
                  <input type="text" value={price && sqft ? `$${Math.round(parseInt(price) / parseInt(sqft))}` : ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                  <p className="mt-1 text-sm text-gray-500">Calculated automatically</p>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold">Property Details</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" step="0.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
                  <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year Built</label>
                  <input type="text" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={4} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold">Property Description</h2>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-sm font-medium hover:shadow-sm transition-all flex items-center gap-1.5 border border-purple-200">
                  <Sparkles className="w-4 h-4" /> AI Enhance
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe the property, its features, and what makes it special..." />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">{description.length} characters</p>
                <p className="text-sm text-gray-500">{description.split(' ').filter((w) => w.length > 0).length} words</p>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                  <h2 className="font-semibold">Photos</h2>
                </div>
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Photos
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Drag and drop photos here</p>
                <p className="text-sm text-gray-500 mt-1">or click Upload Photos above</p>
                <p className="text-xs text-gray-400 mt-3">Supports JPG, PNG, HEIC up to 10MB each</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-orange-600" />
                <h2 className="font-semibold">Features & Amenities</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a feature or amenity..."
                  />
                  <button onClick={handleAddFeature} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg group">
                        <span className="text-sm">{feature}</span>
                        <button onClick={() => handleDeleteFeature(index)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4 text-gray-500 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No features added yet. Start typing above to add property features.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">Listing Settings</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listing Status</label>
                  <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Published</div>
                      <div className="text-xs text-gray-500 mt-1">Visible to public</div>
                    </div>
                    <Switch.Root checked={isPublished} onCheckedChange={setIsPublished} className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors">
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                    </Switch.Root>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Featured Listing</div>
                      <div className="text-xs text-gray-500 mt-1">Highlight on homepage</div>
                    </div>
                    <Switch.Root checked={isFeatured} onCheckedChange={setIsFeatured} className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors">
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                    </Switch.Root>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <button onClick={handleSave} className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Create Listing
                  </button>
                  <button onClick={handleCancel} className="w-full px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
