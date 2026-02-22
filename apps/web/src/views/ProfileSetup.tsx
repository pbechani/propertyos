'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  User,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Camera,
  Building,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ApiError, usersApi } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState({
    idCard: false,
    businessLicense: false,
    proofOfAddress: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const token = getAccessToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const me = await usersApi.me(token);
        setFirstName(me.firstName ?? "");
        setLastName(me.lastName ?? "");
        setPhone(me.phone ?? "");
      } catch {
        setError("Unable to load profile details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setIsSavingProfile(true);

    try {
      await usersApi.updateMe(token, {
        firstName,
        lastName,
        phone,
      });
      setCurrentTab("business");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save profile details.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleComplete = () => {
    navigate("/kyc-upload");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Complete Your Profile</h1>
              <p className="text-sm md:text-base text-gray-600">
                Help us verify your identity to access all features
              </p>
            </div>
            <VerificationBadge status="pending" size="lg" />
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: "50%" }}
              ></div>
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-600 whitespace-nowrap">50% Complete</span>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-6 w-full flex-wrap">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs md:text-sm">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Profile Info</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2 text-xs md:text-sm">
              <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Business Details</span>
              <span className="sm:hidden">Business</span>
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2 text-xs md:text-sm">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">KYC Verification</span>
              <span className="sm:hidden">KYC</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="profile">
            <Card className="p-4 md:p-6 lg:p-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Personal Information</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-sm text-gray-600">Loading profile...</div>
              ) : (
              <>

              <div className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <Button variant="outline" className="mb-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / About Me
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about yourself and your experience..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    placeholder="Street address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSavingProfile ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
              </>
              )}
            </Card>
          </TabsContent>

          {/* Business Details Tab */}
          <TabsContent value="business">
            <Card className="p-4 md:p-6 lg:p-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Business Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your company or agency name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Real Estate Agency</option>
                      <option>Independent Agent</option>
                      <option>Brokerage Firm</option>
                      <option>Property Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Real estate license #"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Less than 1 year</option>
                    <option>1-3 years</option>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Expertise
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Residential Sales",
                      "Commercial Sales",
                      "Rentals",
                      "Luxury Properties",
                      "First-Time Buyers",
                      "Investment Properties",
                    ].map((area) => (
                      <label key={area} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  onClick={() => setCurrentTab("profile")}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentTab("kyc")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* KYC Verification Tab */}
          <TabsContent value="kyc">
            <Card className="p-4 md:p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Identity Verification (KYC)</h2>
                <p className="text-gray-600">
                  Upload required documents to verify your identity and get a verified badge
                </p>
              </div>

              <div className="space-y-6">
                {/* ID Card */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Government-Issued ID</h3>
                        <p className="text-sm text-gray-600">
                          Passport, Driver's License, or National ID
                        </p>
                      </div>
                    </div>
                    {uploadedDocs.idCard ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Required</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setUploadedDocs((prev) => ({ ...prev, idCard: true }))
                    }
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.idCard ? "Replace Document" : "Upload Document"}
                  </Button>
                </div>

                {/* Business License */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Business License / Certificate</h3>
                        <p className="text-sm text-gray-600">
                          Real estate license or business registration
                        </p>
                      </div>
                    </div>
                    {uploadedDocs.businessLicense ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Required</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setUploadedDocs((prev) => ({ ...prev, businessLicense: true }))
                    }
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.businessLicense ? "Replace Document" : "Upload Document"}
                  </Button>
                </div>

                {/* Proof of Address */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Proof of Address</h3>
                        <p className="text-sm text-gray-600">
                          Utility bill or bank statement (last 3 months)
                        </p>
                      </div>
                    </div>
                    {uploadedDocs.proofOfAddress ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Optional</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setUploadedDocs((prev) => ({ ...prev, proofOfAddress: true }))
                    }
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.proofOfAddress ? "Replace Document" : "Upload Document"}
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  🔒 <strong>Your documents are secure.</strong> All uploads are encrypted and
                  only accessible by our verification team. We typically review documents within
                  24-48 hours.
                </p>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  onClick={() => setCurrentTab("business")}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!uploadedDocs.idCard || !uploadedDocs.businessLicense}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit for Verification
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}