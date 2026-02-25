'use client';

import {
  Shield,
  Home as HomeIcon,
  CheckCircle,
  Building2,
  Hammer,
  Globe,
  Lock,
  Database,
  FileCheck,
  Package,
  Truck,
  BarChart3,
  Bot,
  Sparkles,
  AlertTriangle,
  Layers,
  Zap,
  Eye,
  ChevronRight,
  Building,
  Wallet,
  Camera,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PublicHome() {
  const problems = [
    {
      domain: "Property Market",
      issues: [
        "Double-selling of land",
        "Documentation fraud",
        "No ownership transparency",
      ],
      icon: Building2,
      color: "red",
    },
    {
      domain: "Construction",
      issues: [
        "Cost opacity",
        "Unreliable contractors",
        "Budget overruns",
        "Communication breakdown",
      ],
      icon: Hammer,
      color: "orange",
    },
    {
      domain: "Diaspora Investors",
      issues: [
        "Remote oversight challenges",
        "Trust deficit",
        "High fraud exposure",
      ],
      icon: Globe,
      color: "purple",
    },
  ];

  const platforms = [
    {
      title: "Property Marketplace",
      icon: Building2,
      features: [
        "Verified property listings with ownership history",
        "14-stage purchase pipeline with full transparency",
        "Agent, buyer, seller, and conveyancer dashboards",
        "Government department tracking (Land Registry, Deeds Office, Tax Authority)",
      ],
      color: "blue",
    },
    {
      title: "Construction Management",
      icon: Hammer,
      features: [
        "Project tracking with budget vs actual visualization",
        "11 construction stages with government inspection workflow",
        "Intelligent BOQ system — AI-powered quantity calculation",
        "Milestone-based escrow releases",
      ],
      color: "orange",
    },
    {
      title: "Marketplaces",
      icon: Package,
      features: [
        "Service Provider Marketplace — Verified professionals, bidding, ratings",
        "Supplier Marketplace — 10,000+ materials, RFQ system, price index",
        "Logistics Marketplace — On-demand truck operators (Uber for construction)",
      ],
      color: "green",
    },
    {
      title: "Trust Layer",
      icon: Shield,
      features: [
        "Geo-tagged, timestamped progress photos (offline-first)",
        "Event-sourced financial ledger (double-entry, immutable)",
        "Multi-currency escrow with two-step approval",
        "Append-only audit logs",
      ],
      color: "purple",
    },
    {
      title: "AI Engine",
      icon: Bot,
      features: [
        "Document AI (OCR, verification, classification)",
        "Legal intelligence with RAG (building codes, regulations)",
        "AI House Design Assistant — voice/text to floor plans to BOQ",
        "Risk scoring and fraud detection",
      ],
      color: "pink",
    },
  ];

  const trustFeatures = [
    {
      icon: FileCheck,
      title: "Verified Listings",
      description: "Every property verified with blockchain-backed ownership history",
    },
    {
      icon: Lock,
      title: "Secure Escrow",
      description: "Bank-grade multi-signature escrow with milestone-based releases",
    },
    {
      icon: Camera,
      title: "Live Progress Tracking",
      description: "Geo-tagged, timestamped photos from construction sites",
    },
    {
      icon: BarChart3,
      title: "Financial Transparency",
      description: "Real-time budget tracking with immutable audit trails",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-black text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Financial-Grade Infrastructure for Emerging Markets
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Real Estate &<br />
              <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Construction Trust Platform
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              A financial-grade digital infrastructure for property buying, construction management, 
              and supplier marketplaces — targeting emerging markets with diaspora confidence, 
              transparency, and fraud prevention.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 text-lg px-8 py-6"
                >
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
              <Link to="/safety">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Learn About Trust & Safety
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { icon: Shield, label: "Blockchain Verified" },
                { icon: Lock, label: "Bank-Grade Escrow" },
                { icon: Eye, label: "Full Transparency" },
                { icon: Globe, label: "Diaspora Focused" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4">
              <AlertTriangle className="w-4 h-4" />
              Problems We Solve
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Addressing Critical Market Failures
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We tackle the most pressing challenges in emerging market property transactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((problem, idx) => (
              <Card
                key={idx}
                className="p-8 bg-white border-2 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-${problem.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                  <problem.icon className={`w-8 h-8 text-${problem.color}-600`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{problem.domain}</h3>
                <ul className="space-y-3">
                  {problem.issues.map((issue, issueIdx) => (
                    <li key={issueIdx} className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <Layers className="w-4 h-4" />
              Core Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Comprehensive Digital Infrastructure
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Five integrated modules working together to ensure transparency, security, and trust
            </p>
          </div>

          <div className="space-y-8">
            {platforms.map((platform, idx) => (
              <Card
                key={idx}
                className="p-8 border-2 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 bg-${platform.color}-100 rounded-xl flex items-center justify-center shrink-0`}>
                    <platform.icon className={`w-8 h-8 text-${platform.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">{platform.title}</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {platform.features.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features Section */}
      <section className="py-20 bg-linear-to-br from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4 text-green-400" />
              Trust & Security
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for Diaspora Confidence
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every feature designed to eliminate fraud and provide complete transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature, idx) => (
              <Card
                key={idx}
                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: FileCheck, label: "14-Stage", sublabel: "Purchase Pipeline" },
              { icon: Hammer, label: "11-Stage", sublabel: "Construction Workflow" },
              { icon: Package, label: "10,000+", sublabel: "Materials Available" },
              { icon: Database, label: "100%", sublabel: "Audit Trail Coverage" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.label}</div>
                <div className="text-sm text-gray-400">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Features */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Platform Highlights
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                End-to-End Property & Construction Ecosystem
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Building,
                    title: "Property Sale Workspace",
                    description: "14-stage pipeline with role-specific views for buyers, sellers, agents, and conveyancers. Government department integration included.",
                  },
                  {
                    icon: Hammer,
                    title: "Intelligent BOQ System",
                    description: "AI-powered quantity calculation, multi-tier pricing, real-time material swapping with 10,000+ items.",
                  },
                  {
                    icon: Truck,
                    title: "Logistics Marketplace",
                    description: "On-demand truck operators for construction materials — the Uber of construction delivery.",
                  },
                  {
                    icon: Wallet,
                    title: "Multi-Currency Escrow",
                    description: "Bank-grade escrow with two-step approval, milestone-based releases, and complete audit trails.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <Card className="bg-white p-6 mb-4 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold">Property Verified</div>
                        <div className="text-sm text-gray-500">Blockchain Backed</div>
                      </div>
                    </div>
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-blue-600 to-green-600 w-3/4"></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Stage 11 of 14 — Due Diligence Complete</div>
                </Card>

                <Card className="bg-white p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Hammer className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-bold">Construction Progress</div>
                        <div className="text-sm text-gray-500">Live Updates</div>
                      </div>
                    </div>
                    <Camera className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-green-100 rounded-lg aspect-square flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="bg-green-100 rounded-lg aspect-square flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="bg-blue-100 rounded-lg aspect-square flex items-center justify-center">
                      <Hammer className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget: $145K / $150K</span>
                    <span className="font-bold text-green-600">On Track</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Property Journey?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join PropertyOS today and experience the future of transparent, secure property 
            transactions and construction management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-7"
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/buyer">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7"
              >
                Explore Platform
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-black" />
                </div>
                <span className="font-bold text-xl">PropertyOS</span>
              </Link>
              <p className="text-gray-400 leading-relaxed mb-6">
                Financial-grade infrastructure for property buying, construction management, 
                and supplier marketplaces in emerging markets.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Blockchain Verified</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link to="/buyer" className="hover:text-white transition-colors">
                    Property Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/app/construction" className="hover:text-white transition-colors">
                    Construction Management
                  </Link>
                </li>
                <li>
                  <Link to="/service-providers" className="hover:text-white transition-colors">
                    Service Provider Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="hover:text-white transition-colors">
                    Trust & Safety
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link to="/app/escrow" className="hover:text-white transition-colors">
                    Escrow & Payments
                  </Link>
                </li>
                <li>
                  <Link to="/app/boq" className="hover:text-white transition-colors">
                    BOQ Workspace
                  </Link>
                </li>
                <li>
                  <Link to="/app/ai-design" className="hover:text-white transition-colors">
                    AI Design Studio
                  </Link>
                </li>
                <li>
                  <Link to="/app/logistics" className="hover:text-white transition-colors">
                    Logistics Marketplace
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    For Investors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 PropertyOS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                title="Follow PropertyOS on X"
                aria-label="Follow PropertyOS on X"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                title="View PropertyOS on GitHub"
                aria-label="View PropertyOS on GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                title="Connect with PropertyOS on LinkedIn"
                aria-label="Connect with PropertyOS on LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}