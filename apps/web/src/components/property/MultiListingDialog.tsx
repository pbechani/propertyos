'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, BedDouble, Bath, CarFront, Maximize, Users } from 'lucide-react';
import PropertyCardHeader from '@/components/property/PropertyCardHeader';

export interface MultiListingItem {
  id: string;
  title: string;
  location: string;
  addressLine1: string | null;
  price: string;
  beds: number;
  baths: number;
  garage: number;
  garages: number;
  carports: number;
  sqm: number;
  propertyType: string;
  image: string;
  agent: string;
  agentCompany: string;
  agentAvatarUrl: string | null;
  agentCompanyLogoUrl: string | null;
  agentCompanyBrandColor: string | null;
  isPrivateListing: boolean;
}

export interface MultiListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: MultiListingItem[];
  onSelectListing: (id: string) => void;
}

export default function MultiListingDialog({
  open,
  onOpenChange,
  listings,
  onSelectListing,
}: MultiListingDialogProps) {
  if (listings.length === 0) return null;

  const firstListing = listings[0];
  const agencyCount = listings.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-gray-200 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            {firstListing.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs font-medium">
              <Users className="w-3 h-3 mr-1" />
              Listed by {agencyCount} Estate {agencyCount === 1 ? 'Agency' : 'Agencies'}
            </Badge>
            {firstListing.addressLine1 && (
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {firstListing.addressLine1}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {listings.map((listing) => (
            <button
              key={listing.id}
              type="button"
              className="w-full text-left rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => onSelectListing(listing.id)}
            >
              {/* Agency header */}
              <PropertyCardHeader
                isPrivateListing={listing.isPrivateListing}
                companyLogoUrl={listing.agentCompanyLogoUrl}
                companyName={listing.agentCompany}
                companyBrandColor={listing.agentCompanyBrandColor}
                personName={listing.agent}
                personAvatarUrl={listing.agentAvatarUrl}
              />
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="shrink-0 w-28 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                    <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{listing.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{listing.location}</span>
                  </p>
                  {/* Specs row */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />{listing.beds}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="w-3 h-3" />{listing.baths}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CarFront className="w-3 h-3" />
                      {listing.garages > 0 || listing.carports > 0
                        ? `${listing.garages}G ${listing.carports}C`
                        : listing.garage}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Maximize className="w-3 h-3" />{listing.sqm} m²
                    </span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded capitalize">
                      {listing.propertyType}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
