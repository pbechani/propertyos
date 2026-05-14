'use client';

import { Link } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  LayoutDashboard,
  ClipboardList,
  Camera,
  Shield,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package
} from 'lucide-react';

export function MobileApp() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Construction App</h1>
        <p className="text-gray-500">
          On-site tools designed for field workers and site managers
        </p>
        <Badge className="mt-3 bg-blue-100 text-blue-800">
          Optimized for Mobile & Tablets
        </Badge>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mobile Dashboard */}
        <Link to="/construction/mobile-dashboard">
          <Card className="hover:shadow-xl transition-all hover:border-blue-400 cursor-pointer h-full border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Mobile Dashboard</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Quick site overview</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access critical site information on the go with touch-optimized widgets.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Today's tasks with progress tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span>Quick photo upload & capture</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Package className="w-4 h-4 text-green-600" />
                  <span>Material request tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span>Real-time safety alerts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Mobile Site Log */}
        <Link to="/construction/mobile-site-log">
          <Card className="hover:shadow-xl transition-all hover:border-purple-400 cursor-pointer h-full border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Site Log Entry</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Daily documentation</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Complete mobile-optimized form for documenting daily site activities.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Work completed tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <span>Photo documentation with captions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🎤</span>
                  </span>
                  <span>Voice notes recording</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>Issues & concerns reporting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Features Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2">
        <CardHeader>
          <CardTitle>Mobile App Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Real-Time Updates
              </h3>
              <p className="text-sm text-gray-600">
                Get instant notifications about tasks, safety alerts, and material requests.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Photo Documentation
              </h3>
              <p className="text-sm text-gray-600">
                Capture and upload site photos with automatic timestamp and location tagging.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Safety First
              </h3>
              <p className="text-sm text-gray-600">
                Immediate safety alerts and incident reporting for on-site teams.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Best Viewed On</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-gray-100 text-gray-800">📱 iOS & Android Phones</Badge>
            <Badge className="bg-gray-100 text-gray-800">📱 Tablets (iPad, Android)</Badge>
            <Badge className="bg-gray-100 text-gray-800">💻 Touch-enabled Laptops</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            The mobile interface is optimized for touch interactions and smaller screens, perfect for on-site use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
