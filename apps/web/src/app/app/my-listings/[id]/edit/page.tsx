'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  X,
  Upload,
  Trash2,
  Plus,
  Home,
  DollarSign,
  MapPin,
  FileText,
  Image as ImageIcon,
  Settings,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { propertiesApi, type PropertyListing } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { ListingBreadcrumbHeader } from '@/components/my-listings/ListingBreadcrumbHeader';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [property, setProperty] = useState<PropertyListing | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !listingId) return;
    propertiesApi.getById(listingId, token)
      .then(setProperty)
      .catch(() => null);
  }, [listingId]);

  const [listingStatus, setListingStatus] = useState('active');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [price, setPrice] = useState('825000');
  const [address, setAddress] = useState('2847 Westwood Boulevard');
  const [city, setCity] = useState('Los Angeles');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('90064');
  const [bedrooms, setBedrooms] = useState('4');
  const [bathrooms, setBathrooms] = useState('3');
  const [sqft, setSqft] = useState('2450');
  const [yearBuilt, setYearBuilt] = useState('2015');
  const [propertyType, setPropertyType] = useState('single-family');
  const [mlsNumber, setMlsNumber] = useState('SR24087523');
  const [description, setDescription] = useState(
    'Welcome to this stunning modern residence in the heart of Westwood. This beautifully designed 4-bedroom, 3-bathroom home features an open-concept layout with high-end finishes throughout. The gourmet kitchen boasts top-of-the-line appliances, custom cabinetry, and a large island perfect for entertaining. The spacious master suite includes a luxurious en-suite bathroom and walk-in closet. Enjoy the private backyard oasis complete with outdoor kitchen and fire pit. Located in a prime neighborhood with excellent schools and convenient access to shopping and dining.'
  );

  const [photos, setPhotos] = useState([
    { id: 1, url: 'https://images.unsplash.com/photo-1706808849802-8f876ade0d1f?w=800', isPrimary: true },
    { id: 2, url: 'https://images.unsplash.com/photo-1638369022547-1c763b1b9b3b?w=800', isPrimary: false },
    { id: 3, url: 'https://images.unsplash.com/photo-1592839656073-833413ae8874?w=800', isPrimary: false },
    { id: 4, url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800', isPrimary: false },
    { id: 5, url: 'https://images.unsplash.com/photo-1638799869566-b17fa794c4de?w=800', isPrimary: false },
  ]);

  const [features, setFeatures] = useState([
    'Hardwood Floors', 'Central Air Conditioning', 'Updated Kitchen', 'Fireplace',
    'Walk-in Closets', 'Stainless Steel Appliances', 'Granite Countertops',
    'Private Backyard', 'Outdoor Kitchen', 'Fire Pit', 'Two-Car Garage', 'Smart Home Features',
  ]);
  const [newFeature, setNewFeature] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = () => {
    setHasUnsavedChanges(false);
    router.push('/app/my-listings');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push(`/app/my-listings/${listingId}`);
  };

  const handleDeletePhoto = (id: number) => {
    setPhotos(photos.filter((p) => p.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSetPrimaryPhoto = (id: number) => {
    setPhotos(photos.map((p) => ({ ...p, isPrimary: p.id === id })));
    setHasUnsavedChanges(true);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ListingBreadcrumbHeader
        backHref={`/app/my-listings/${listingId}`}
        listingId={listingId}
        address={property?.location?.address_line1 ?? property?.title ?? null}
        listingStatus={property?.status ?? null}
        crumbs={[{ label: 'Edit Listing' }]}
        titleOverride="Edit Listing"
        rightSlot={
          <>
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </span>
            )}
            <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </>
        }
      />

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
                    <select value={propertyType} onChange={(e) => { setPropertyType(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <input type="text" value={mlsNumber} onChange={(e) => { setMlsNumber(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="SR24087523" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input type="text" value={address} onChange={(e) => { setAddress(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" value={city} onChange={(e) => { setCity(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" value={state} onChange={(e) => { setState(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input type="text" value={zipCode} onChange={(e) => { setZipCode(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                    <input type="text" value={price} onChange={(e) => { setPrice(e.target.value.replace(/[^0-9]/g, '')); setHasUnsavedChanges(true); }} className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="825000" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{price && `$${parseInt(price).toLocaleString()}`}</p>
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
                  <input type="number" value={bedrooms} onChange={(e) => { setBedrooms(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <input type="number" value={bathrooms} onChange={(e) => { setBathrooms(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" step="0.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
                  <input type="text" value={sqft} onChange={(e) => { setSqft(e.target.value.replace(/[^0-9]/g, '')); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year Built</label>
                  <input type="text" value={yearBuilt} onChange={(e) => { setYearBuilt(e.target.value.replace(/[^0-9]/g, '')); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={4} />
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
              <textarea value={description} onChange={(e) => { setDescription(e.target.value); setHasUnsavedChanges(true); }} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe the property, its features, and what makes it special..." />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">{description.length} characters</p>
                <p className="text-sm text-gray-500">{description.split(' ').filter((word) => word.length > 0).length} words</p>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`Property ${photo.id}`} className="w-full h-40 object-cover rounded-lg" />
                    {photo.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">Primary</span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      {!photo.isPrimary && (
                        <button onClick={() => handleSetPrimaryPhoto(photo.id)} className="px-3 py-1.5 bg-white text-gray-900 text-sm rounded-lg hover:bg-gray-100">Set Primary</button>
                      )}
                      <button onClick={() => handleDeletePhoto(photo.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">Tip: The first photo marked as &quot;Primary&quot; will be displayed as the main listing image</p>
            </div>

            {/* Features & Amenities */}
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
                  <select value={listingStatus} onChange={(e) => { setListingStatus(e.target.value); setHasUnsavedChanges(true); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="under-contract">Under Contract</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Published</div>
                      <div className="text-xs text-gray-500 mt-1">Visible to public</div>
                    </div>
                    <Switch.Root checked={isPublished} onCheckedChange={(checked) => { setIsPublished(checked); setHasUnsavedChanges(true); }} className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors">
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                    </Switch.Root>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Featured Listing</div>
                      <div className="text-xs text-gray-500 mt-1">Highlight on homepage</div>
                    </div>
                    <Switch.Root checked={isFeatured} onCheckedChange={(checked) => { setIsFeatured(checked); setHasUnsavedChanges(true); }} className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors">
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                    </Switch.Root>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Total Views</span><span className="font-medium">1,234</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Saved by</span><span className="font-medium">87 users</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Last Updated</span><span className="font-medium">2 days ago</span></div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <button onClick={handleSave} className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Save Changes
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
