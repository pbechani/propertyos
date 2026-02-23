'use client';

import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Home, Shield, CheckCircle, TrendingUp, Users, 
  ArrowRight, Star, DollarSign,
  Award, Zap, Search
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function PublicHomeVariation1() {
  const features = [
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "256-bit encryption & blockchain verification for every transaction",
      color: "blue"
    },
    {
      icon: Users,
      title: "Verified Agents Only",
      description: "Every agent undergoes KYC & background verification",
      color: "purple"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analytics",
      description: "Market insights powered by AI and machine learning",
      color: "green"
    },
    {
      icon: Award,
      title: "Fraud Protection",
      description: "24/7 monitoring with instant fraud detection & reporting",
      color: "orange"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Listings", icon: Home },
    { value: "99.8%", label: "Trust Score", icon: Shield },
    { value: "12K+", label: "Verified Agents", icon: Users },
    { value: "$2.4B", label: "Transactions", icon: DollarSign }
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Property Buyer",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      quote: "The KYC verification gave me confidence. I knew I was dealing with legitimate professionals."
    },
    {
      name: "Marcus Chen",
      role: "Real Estate Agent",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      quote: "This platform transformed my business. The analytics and lead management are exceptional."
    },
    {
      name: "Jennifer Lopez",
      role: "Property Investor",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      quote: "Finally, a marketplace that prioritizes security and transparency. Game changer!"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">
                PropertyOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Pro</span>
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <Link to="/safety" className="hidden md:inline-flex text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Safety Center
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="hidden md:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Screen */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Trusted by 50,000+ Users
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Trusted</span><br />
                Property<br />
                Marketplace
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Buy, sell, or rent with confidence. Every listing is verified, every agent is authenticated, and every transaction is secured.
              </p>

              {/* Search Bar */}
              <div className="bg-white rounded-2xl shadow-2xl p-3 mb-8 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search location, property type..."
                      className="flex-1 bg-transparent outline-none text-gray-700"
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-xl shadow-lg">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6">
                {stats.slice(0, 3).map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop"
                    alt="Luxury property"
                    className="rounded-2xl shadow-xl w-full h-64 object-cover"
                  />
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="text-3xl font-bold">$2.4B+</div>
                    <div className="text-blue-100">Transaction Volume</div>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold">Verified</div>
                        <div className="text-xs text-gray-600">100% Authentic</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">All listings verified by our team</div>
                  </div>
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop"
                    alt="Modern home"
                    className="rounded-2xl shadow-xl w-full h-64 object-cover"
                  />
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Bank-Level</div>
                    <div className="text-xs text-gray-600">Security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Choose PropertyOS Pro?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most advanced, secure, and transparent property marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx} 
                  className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 group"
                >
                  <div className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 fill-current" />
              4.9/5 Average Rating
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Thousands</h2>
            <p className="text-xl text-gray-600">See what our users are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-8 bg-white hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of verified professionals and property seekers in the most secure marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">PropertyOS Pro</span>
              </div>
              <p className="text-gray-400 text-sm">The trusted property marketplace with verified listings and agents.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            © 2024 PropertyOS Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}