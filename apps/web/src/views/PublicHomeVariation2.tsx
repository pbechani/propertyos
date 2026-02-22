'use client';

import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Home, Shield, CheckCircle, ArrowRight, Star, 
  TrendingUp, Lock, Eye, Award, Users, Zap,
  Building2, MapPin, DollarSign, Clock
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function PublicHomeVariation2() {
  const benefits = [
    {
      title: "Verified Listings",
      description: "Every property is authenticated and verified by our team",
      icon: CheckCircle
    },
    {
      title: "Secure Transactions",
      description: "Bank-level encryption protects your sensitive data",
      icon: Lock
    },
    {
      title: "Trusted Agents",
      description: "KYC-verified professionals you can rely on",
      icon: Users
    },
    {
      title: "Market Insights",
      description: "Real-time analytics and pricing intelligence",
      icon: TrendingUp
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Account",
      description: "Sign up in minutes with our streamlined process"
    },
    {
      number: "02",
      title: "Get Verified",
      description: "Complete KYC verification for full access"
    },
    {
      number: "03",
      title: "Start Trading",
      description: "Buy, sell, or rent with complete confidence"
    }
  ];

  const properties = [
    {
      id: 1,
      title: "Modern Villa in Sunset District",
      location: "Los Angeles, CA",
      price: "$2,450,000",
      beds: 4,
      baths: 3,
      sqft: "3,200",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop",
      verified: true
    },
    {
      id: 2,
      title: "Luxury Penthouse Downtown",
      location: "New York, NY",
      price: "$5,200,000",
      beds: 3,
      baths: 2,
      sqft: "2,800",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
      verified: true
    },
    {
      id: 3,
      title: "Contemporary Beach House",
      location: "Miami, FL",
      price: "$3,750,000",
      beds: 5,
      baths: 4,
      sqft: "4,100",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
      verified: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">PropertyOS</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/safety" className="hidden md:inline-flex text-gray-600 hover:text-black font-medium transition-colors px-4">
                Safety
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-black">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Minimal & Clean */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm mb-8">
              <CheckCircle className="w-4 h-4" />
              Trusted by 50,000+ verified users
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
              Property marketplace<br />
              <span className="text-gray-400">you can trust</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Every listing verified. Every agent authenticated. Every transaction secured with military-grade encryption.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/register">
                <Button className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-full">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-2 border-gray-200 hover:border-black px-8 py-6 text-lg rounded-full">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Minimal Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8 border-t border-gray-100">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">50K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">99.8%</div>
                <div className="text-sm text-gray-600">Trust Score</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">12K+</div>
                <div className="text-sm text-gray-600">Agents</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">$2.4B</div>
                <div className="text-sm text-gray-600">Volume</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Properties</h2>
                <p className="text-gray-600">Handpicked luxury listings</p>
              </div>
              <Button variant="ghost" className="hidden md:flex">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Card key={property.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img 
                      src={property.image} 
                      alt={property.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {property.verified && (
                      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      {property.location}
                    </div>
                    <h3 className="font-bold text-xl mb-3">{property.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{property.beds} beds</span>
                      <span>•</span>
                      <span>{property.baths} baths</span>
                      <span>•</span>
                      <span>{property.sqft} sqft</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{property.price}</div>
                      <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why PropertyOS?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The most secure and transparent way to buy, sell, or rent property
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">Get started in three simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="text-6xl font-bold text-gray-200 mb-4">{step.number}</div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-8 w-6 h-6 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 border-2 hover:border-black transition-colors">
                <Shield className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Military-Grade Security</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  256-bit encryption and blockchain verification for every transaction
                </p>
              </Card>
              <Card className="p-8 border-2 hover:border-black transition-colors">
                <Eye className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Complete property history, market analysis, and agent verification
                </p>
              </Card>
              <Card className="p-8 border-2 hover:border-black transition-colors">
                <Award className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Dedicated team monitoring for fraud and providing instant assistance
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
              ))}
            </div>
            <div className="text-4xl md:text-5xl font-bold mb-4">4.9 out of 5</div>
            <p className="text-xl text-gray-600 mb-8">
              Based on 12,450+ reviews from verified users
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
              <span>✓ Verified Reviews</span>
              <span>•</span>
              <span>✓ Real Customers</span>
              <span>•</span>
              <span>✓ Independently Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Start your property<br />journey today
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join thousands of verified users who trust PropertyOS for their property transactions
            </p>
            <Link to="/register">
              <Button className="bg-white text-black hover:bg-gray-100 px-10 py-7 text-lg rounded-full">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">PropertyOS</span>
                </div>
                <p className="text-sm text-gray-600 max-w-xs">
                  The trusted property marketplace with verified listings and authenticated agents.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-sm">Product</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-black">Features</a></li>
                  <li><a href="#" className="hover:text-black">Pricing</a></li>
                  <li><a href="#" className="hover:text-black">Security</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-sm">Company</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-black">About</a></li>
                  <li><a href="#" className="hover:text-black">Careers</a></li>
                  <li><a href="#" className="hover:text-black">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-sm">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-black">Privacy</a></li>
                  <li><a href="#" className="hover:text-black">Terms</a></li>
                  <li><a href="#" className="hover:text-black">Compliance</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
              <div>© 2024 PropertyOS. All rights reserved.</div>
              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-black">Twitter</a>
                <a href="#" className="hover:text-black">LinkedIn</a>
                <a href="#" className="hover:text-black">Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}