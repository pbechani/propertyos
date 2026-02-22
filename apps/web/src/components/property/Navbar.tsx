'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#0A1628] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center">
            <span className="text-[#0A1628] font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">PRIBEC</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/properties" className="text-white/80 hover:text-white transition-colors">Marketplace</Link>
          <Link href="/properties/search" className="text-white/80 hover:text-white transition-colors">Search</Link>
          <Link href="/buyer" className="text-white/80 hover:text-white transition-colors">Buy</Link>
          <Link href="/agent" className="text-white/80 hover:text-white transition-colors">Agents</Link>
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="bg-[#F5A623] text-[#0A1628] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#FBBF47] transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0F2040] border-t border-white/10 px-4 pb-4 flex flex-col gap-3 pt-3">
          <Link href="/properties" className="text-white/80 hover:text-white text-sm">Marketplace</Link>
          <Link href="/properties/search" className="text-white/80 hover:text-white text-sm">Search</Link>
          <Link href="/buyer" className="text-white/80 hover:text-white text-sm">Buy</Link>
          <Link href="/agent" className="text-white/80 hover:text-white text-sm">Agents</Link>
          <Link href="/auth/login" className="text-white/80 hover:text-white text-sm">Sign In</Link>
          <Link href="/auth/register" className="bg-[#F5A623] text-[#0A1628] text-sm font-bold px-4 py-2 rounded-lg text-center">Get Started</Link>
        </div>
      )}
    </nav>
  );
}
