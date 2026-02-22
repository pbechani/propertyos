import { useState } from "react";
import { MapPin, Filter, Grid3x3, List, Bookmark, Shield, Search, Map, X, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";

export default function Listings() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchText, setVoiceSearchText] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleVoiceSearch = () => {
    setShowVoiceModal(true);
    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      const mockQuery = "Show me 3 bedroom houses in Cape Town with a pool under 10 million rand";
      setVoiceSearchText(mockQuery);
      setIsListening(false);
      
      // Simulate AI processing and suggestions
      setTimeout(() => {
        setAiSuggestions([
          "3+ bedrooms",
          "Cape Town location",
          "Pool included",
          "Price: Under R 10M",
          "Verified properties only"
        ]);
      }, 500);
    }, 3000);
  };

  const handleApplyVoiceSearch = () => {
    setShowVoiceModal(false);
    // Apply the search filters based on voice input
  };

  const properties = [
    {
      id: 1,
      title: "88 Sunset Boulevard",
      location: "Camps Bay, Cape Town",
      price: "R 12,500,000",
      beds: 4,
      baths: 3.5,
      garage: 2,
      sqm: 340,
      verified: true,
      stage: "Stage 3 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "Sarah Jenkins",
      agentCompany: "PRIBEC Premier Agent",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=400&fit=crop",
    },
    {
      id: 2,
      title: "204 Sky View",
      location: "Sea Point, Cape Town",
      price: "R 4,250,000",
      beds: 2,
      baths: 2,
      garage: 1,
      sqm: 112,
      verified: true,
      stage: "Stage 1 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "Michelle V.",
      agentCompany: "Pam Golding Properties",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop",
    },
    {
      id: 3,
      title: "45 Green Oaks",
      location: "Riverside Suburb",
      price: "R 8,750,000",
      beds: 3,
      baths: 2,
      garage: 2,
      sqm: 240,
      verified: true,
      stage: "Stage 2 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "David Chen",
      agentCompany: "Platinum Realty",
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=400&fit=crop",
    },
    {
      id: 4,
      title: "15 Ocean Drive",
      location: "Clifton, Cape Town",
      price: "R 18,900,000",
      beds: 5,
      baths: 4,
      garage: 3,
      sqm: 450,
      verified: true,
      stage: "Stage 4 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "Lisa Anderson",
      agentCompany: "Luxury Estates",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=400&fit=crop",
    },
    {
      id: 5,
      title: "22 Mountain View",
      location: "Constantia, Cape Town",
      price: "R 6,500,000",
      beds: 4,
      baths: 3,
      garage: 2,
      sqm: 320,
      verified: true,
      stage: "Stage 1 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "John Smith",
      agentCompany: "Prime Properties",
      image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=500&h=400&fit=crop",
    },
    {
      id: 6,
      title: "88 Harbor Road",
      location: "V&A Waterfront, Cape Town",
      price: "R 11,200,000",
      beds: 3,
      baths: 2.5,
      garage: 2,
      sqm: 280,
      verified: true,
      stage: "Stage 2 of 14",
      status: "TRANSACTION PIPELINE",
      agent: "Emma Wilson",
      agentCompany: "Waterfront Realty",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop",
    },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Mobile Filter Button */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <Button 
          onClick={() => setShowFilters(!showFilters)} 
          variant="outline" 
          className="w-full"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Sidebar */}
      <div className={`
        ${showFilters ? 'block' : 'hidden'} lg:block
        w-full lg:w-80 
        bg-white border-r border-gray-200 
        p-4 md:p-6 
        overflow-auto
        ${showFilters ? 'absolute inset-0 z-50 lg:relative' : ''}
      `}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <button className="text-blue-500 text-sm hover:underline">Reset All</button>
            <button 
              onClick={() => setShowFilters(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verified Toggle */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">Verified Only</span>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </label>
        </div>

        {/* Property Type */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">PROPERTY TYPE</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">House</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Apartment</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Land</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Commercial</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">LOCATION</h3>
          <input
            type="text"
            placeholder="Search location..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Cape Town</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Johannesburg</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Durban</span>
            </label>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">PRICE RANGE</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="R 1,000,000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="R 25,000,000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">ROOMS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bedrooms</span>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center">
                  -
                </button>
                <span className="w-12 text-center">3+</span>
                <button className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bathrooms</span>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center">
                  -
                </button>
                <span className="w-12 text-center">2+</span>
                <button className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">FEATURES</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Pool</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Garden</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Pet Friendly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm">Security</span>
            </label>
          </div>
        </div>

        <Button className="w-full bg-blue-500 hover:bg-blue-600">
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>

        {/* Voice Search Button */}
        <Button 
          onClick={handleVoiceSearch}
          className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Mic className="w-4 h-4 mr-2" />
          AI Voice Search
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-gray-500 text-center mt-2">
          Try: "Show me 3 bedroom houses in Cape Town with a pool"
        </p>
      </div>

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Voice Search</h2>
                    <p className="text-sm text-gray-600">Powered by natural language understanding</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Voice Input Visualization */}
              <div className="mb-6">
                <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                  {isListening ? (
                    <>
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                        {/* Animated circles */}
                        <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping animation-delay-200"></div>
                      </div>
                      <p className="mt-6 text-lg font-semibold text-gray-900">Listening...</p>
                      <p className="text-sm text-gray-600">Speak naturally about what you're looking for</p>
                      
                      {/* Audio waveform visualization */}
                      <div className="flex items-center gap-1 mt-4">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-full animate-wave"
                            style={{
                              height: `${Math.random() * 40 + 20}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    </>
                  ) : voiceSearchText ? (
                    <>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Volume2 className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Captured your voice</p>
                      <div className="bg-white rounded-lg p-4 w-full max-w-lg border-2 border-purple-200">
                        <p className="text-gray-700 italic text-center">"{voiceSearchText}"</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MicOff className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Ready to listen</p>
                      <p className="text-sm text-gray-600">Click the button below to start</p>
                    </>
                  )}
                </div>
              </div>

              {/* AI-Interpreted Filters */}
              {aiSuggestions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">AI Understood Your Search</h3>
                      <p className="text-sm text-blue-700">We've automatically detected these filters:</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <Badge key={idx} className="bg-blue-600 text-white">
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {!voiceSearchText && !isListening && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Try saying:</p>
                  <div className="space-y-2">
                    {[
                      "Show me 3 bedroom houses in Cape Town with a pool under 10 million rand",
                      "Find apartments near the beach with 2 bathrooms",
                      "I want a luxury property in Clifton with ocean views",
                      "Looking for family homes with a garden in Constantia"
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVoiceSearchText(example);
                          setIsListening(false);
                          setTimeout(() => {
                            setAiSuggestions([
                              "3+ bedrooms",
                              "Cape Town location",
                              "Pool included",
                              "Price: Under R 10M",
                              "Verified properties only"
                            ]);
                          }, 500);
                        }}
                        className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        💬 "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowVoiceModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                {voiceSearchText && aiSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplyVoiceSearch}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Apply AI Search
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Results Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-1">
                <span className="text-green-600 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  142 Verified Properties Found
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
                <span className="text-gray-600">APPLIED:</span>
                <Badge variant="secondary">Cape Town</Badge>
                <Badge variant="secondary">Verified Only</Badge>
                <Badge variant="secondary" className="hidden sm:inline-flex">R 5M - R 20M</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
              <select className="flex-1 sm:flex-none px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm">
                <option>Sort by: Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded ${
                    viewMode === "map" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  title="Map View"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 md:mx-6 my-4 md:my-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1 text-sm md:text-base">
                Fraud Alert: Unverified Listings Detected
              </h3>
              <p className="text-xs md:text-sm text-yellow-700">
                We have hidden 3 listings that did not pass our initial blockchain verification check.
                Always ensure the green verified shield is present before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="relative bg-gray-100 rounded-lg h-full min-h-[500px] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=800&fit=crop"
                alt="Map view"
                className="w-full h-full object-cover opacity-70"
              />
              {/* Property pins on map */}
              {properties.slice(0, 4).map((property, idx) => (
                <div 
                  key={property.id}
                  className="absolute bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  style={{
                    top: `${30 + idx * 15}%`,
                    left: `${25 + idx * 20}%`
                  }}
                  title={property.title}
                >
                  <div className="font-bold text-sm whitespace-nowrap">{property.price}</div>
                </div>
              ))}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm hidden md:block">
                <div className="text-sm font-semibold mb-2">Map View</div>
                <div className="text-xs text-gray-600">Click on price markers to view property details</div>
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {viewMode !== "map" && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : "flex flex-col gap-4 md:gap-6"}>
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="group"
              >
                <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}>
                  <div className={`relative ${viewMode === "list" ? "md:w-80 flex-shrink-0" : ""}`}>
                    <img
                      src={property.image}
                      alt={property.title}
                      className={`w-full object-cover ${viewMode === "list" ? "h-48 md:h-full" : "h-48 md:h-64"}`}
                    />
                    {property.verified && (
                      <Badge className="absolute top-3 left-3 bg-green-500">
                        <Shield className="w-3 h-3 mr-1" />
                        VERIFIED
                      </Badge>
                    )}
                    <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-blue-900/80 text-white text-xs">
                        {property.status}
                      </Badge>
                      <div className="text-xs text-white mt-1">{property.stage}</div>
                    </div>
                  </div>
                  <div className="p-4 md:p-5 flex-1">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors truncate">
                          {property.title}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{property.location}</span>
                        </p>
                      </div>
                      <div className="text-lg md:text-xl font-bold text-blue-600 whitespace-nowrap">{property.price}</div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-4 flex-wrap">
                      <span>{property.beds} BEDS</span>
                      <span>{property.baths} BATHS</span>
                      <span>{property.garage} GARAGE</span>
                      <span>{property.sqm} M²</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{property.agent}</div>
                          <div className="text-xs text-gray-500 truncate">{property.agentCompany}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}