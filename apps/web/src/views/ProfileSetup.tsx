'use client';

import { ChangeEvent, useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  User,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { ApiError, kycApi, usersApi } from "@/lib/api-client";
import { getAccessToken, getStoredUser, updateStoredUser } from "@/lib/auth-session";
import { requiresBusinessLicenseForRole } from "@/lib/kyc-requirements";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("profile");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("Real Estate Agency");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("Less than 1 year");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [kycSubmitError, setKycSubmitError] = useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [profileValidationError, setProfileValidationError] = useState("");
  const [businessValidationError, setBusinessValidationError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarInitials, setAvatarInitials] = useState("?");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState({
    idCard: false,
    businessLicense: false,
    proofOfAddress: false,
  });
  const [kycFiles, setKycFiles] = useState<{
    idCard?: File;
    businessLicense?: File;
    proofOfAddress?: File;
  }>({});

  useEffect(() => {
    const loadProfile = async () => {
      if (typeof window !== "undefined") {
        const roleFromSession = window.sessionStorage.getItem("pribec.pending_role");
        if (roleFromSession) {
          setPendingRole(roleFromSession);
        }
      }

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
        setCompanyName(me.companyName ?? "");
        setBusinessType(me.businessType ?? "Real Estate Agency");
        setLicenseNumber(me.licenseNumber ?? "");
        setYearsExperience(me.yearsExperience ?? "Less than 1 year");
        setAvatarUrl(me.avatarUrl ?? null);
        setAvatarInitials(
          `${me.firstName?.[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase() || "?",
        );
        setLoadWarning("");
      } catch {
        const fallbackUser = getStoredUser();
        if (fallbackUser) {
          setFirstName(fallbackUser.firstName ?? "");
          setLastName(fallbackUser.lastName ?? "");
          setPhone(fallbackUser.phone ?? "");
          setCompanyName(fallbackUser.companyName ?? "");
          setBusinessType(fallbackUser.businessType ?? "Real Estate Agency");
          setLicenseNumber(fallbackUser.licenseNumber ?? "");
          setYearsExperience(fallbackUser.yearsExperience ?? "Less than 1 year");
          setAvatarUrl(fallbackUser.avatarUrl ?? null);
          setAvatarInitials(
            `${fallbackUser.firstName?.[0] ?? ""}${fallbackUser.lastName?.[0] ?? ""}`.toUpperCase() || "?",
          );
          setError("");
          setLoadWarning("Showing saved profile details. Some information may be out of date.");
        } else {
          setError("Unable to load profile details.");
          setLoadWarning("");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    const requiredProfileValues = [
      firstName,
      lastName,
      phone,
      dateOfBirth,
      streetAddress,
      city,
      addressState,
      zipCode,
    ];

    if (requiredProfileValues.some((value) => value.trim().length === 0)) {
      setProfileValidationError("Please complete all mandatory fields before proceeding.");
      return;
    }

    setProfileValidationError("");

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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const token = getAccessToken();
    const file = event.target.files?.[0];

    event.target.value = "";
    if (!token || !file) {
      return;
    }

    setAvatarError("");
    setAvatarSuccess(false);

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar image must be 5MB or smaller.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const updated = await usersApi.uploadAvatar(token, file);
      setAvatarUrl(updated.avatarUrl || null);
      setAvatarInitials(
        `${updated.firstName?.[0] ?? ""}${updated.lastName?.[0] ?? ""}`.toUpperCase() || "?",
      );
      updateStoredUser(updated);
      setAvatarSuccess(true);
      window.setTimeout(() => setAvatarSuccess(false), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setAvatarError(err.message);
      } else {
        setAvatarError("Unable to upload avatar. Please try again.");
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleComplete = () => {
    void handleSubmitKyc();
  };

  const handleCancelRoleSetup = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("pribec.pending_role");
    }
    navigate("/profile-dashboard");
  };

  const handleBusinessContinue = async () => {
    const requiredBusinessValues = [companyName, licenseNumber];
    if (requiredBusinessValues.some((value) => value.trim().length === 0)) {
      setBusinessValidationError("Please complete all mandatory fields before proceeding.");
      return;
    }

    setBusinessValidationError("");
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setIsSavingBusiness(true);
    try {
      const updated = await usersApi.updateMe(token, {
        companyName,
        businessType,
        licenseNumber,
        yearsExperience,
      });
      updateStoredUser(updated);
      setCurrentTab("kyc");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to save business details.");
      }
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleKycFileUpload = (docKey: "idCard" | "businessLicense" | "proofOfAddress", file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setKycSubmitError("Only PDF or image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setKycSubmitError("Each document must be 5MB or smaller.");
      return;
    }

    setKycSubmitError("");
    setKycFiles((prev) => ({ ...prev, [docKey]: file }));
    setUploadedDocs((prev) => ({ ...prev, [docKey]: true }));
  };

  const handleSubmitKyc = async () => {
    setKycSubmitError("");

    if (!uploadedDocs.idCard || (isBusinessLicenseRequired && !uploadedDocs.businessLicense)) {
      setKycSubmitError("Please upload all required documents before submitting.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("idDocumentType", "passport");

    if (kycFiles.idCard) {
      formData.append("id_document", kycFiles.idCard);
    }
    if (kycFiles.proofOfAddress) {
      formData.append("address_proof", kycFiles.proofOfAddress);
    }
    if (kycFiles.businessLicense) {
      formData.append("business_registration", kycFiles.businessLicense);
    }

    setIsSubmittingKyc(true);
    try {
      await kycApi.submit(token, formData);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("pribec.pending_role");
      }
      navigate("/profile-dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setKycSubmitError(err.message);
      } else {
        setKycSubmitError("Unable to submit KYC right now.");
      }
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const formatPendingRole = (role: string) =>
    role
      .replace(/_/g, " ")
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const isProfileInfoComplete = [
    firstName,
    lastName,
    phone,
    dateOfBirth,
    streetAddress,
    city,
    addressState,
    zipCode,
  ].every((value) => value.trim().length > 0);

  const isBusinessInfoComplete = [companyName, licenseNumber].every(
    (value) => value.trim().length > 0,
  );
  const isBusinessLicenseRequired = requiresBusinessLicenseForRole(pendingRole);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Complete Role Setup</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Help us verify your identity to access all features
              </p>
            </div>
            <div className="flex items-center gap-2">
              <VerificationBadge status="pending" size="lg" />
              <Button variant="outline" onClick={handleCancelRoleSetup}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-blue-600 transition-all duration-300"></div>
            </div>
            <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">50% Complete</span>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-6 w-full flex-wrap bg-card border border-border">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs md:text-sm">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Profile Info</span>
              <span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="business"
              disabled={!isProfileInfoComplete}
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Business Details</span>
              <span className="sm:hidden">Business</span>
            </TabsTrigger>
            <TabsTrigger
              value="kyc"
              disabled={!isProfileInfoComplete || !isBusinessInfoComplete}
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">KYC Verification</span>
              <span className="sm:hidden">KYC</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="profile">
            <Card className="p-4 md:p-6 lg:p-8 bg-card border border-border">
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">Personal Information</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              {loadWarning && !error && (
                <div className="mb-4 p-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground">
                  {loadWarning}
                </div>
              )}

              {profileValidationError && !error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {profileValidationError}
                </div>
              )}

              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading profile...</div>
              ) : (
              <>

              <div className="space-y-6">
                {/* Profile Photo */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-muted rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-foreground">
                      <UserAvatarContent avatarUrl={avatarUrl} initials={avatarInitials} alt={`${firstName} ${lastName}`.trim() || "Profile"} />
                    </div>
                    <div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        title="Choose profile photo"
                        aria-label="Choose profile photo"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        variant="outline"
                        className="mb-2"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                      {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
                      {avatarSuccess && <p className="text-xs text-green-600 mt-1">Profile photo updated.</p>}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="First name"
                      placeholder="First name"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="Last name"
                      placeholder="Last name"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bio / About Me
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about yourself and your experience..."
                    className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="Phone number"
                      placeholder="Phone number"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="Date of birth"
                      placeholder="Date of birth"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      setProfileValidationError("");
                    }}
                    placeholder="Street address"
                    className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="City"
                      placeholder="City"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressState}
                      onChange={(e) => {
                        setAddressState(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="State"
                      placeholder="State"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => {
                        setZipCode(e.target.value);
                        setProfileValidationError("");
                      }}
                      title="ZIP code"
                      placeholder="ZIP code"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  onClick={handleCancelRoleSetup}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSaveProfile()}
                  disabled={isSavingProfile}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <Card className="p-4 md:p-6 lg:p-8 bg-card border border-border">
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">Business Information</h2>

              {pendingRole && pendingRole !== "buyer" && (
                <div className="mb-6 p-4 rounded-lg border border-border bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You are applying for the <strong>{formatPendingRole(pendingRole)}</strong> role.
                    Complete this section and continue to KYC verification to submit your application.
                  </p>
                </div>
              )}

              {businessValidationError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {businessValidationError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setBusinessValidationError("");
                    }}
                    placeholder="Your company or agency name"
                    className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Type
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      title="Business type"
                      aria-label="Business type"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      <option>Real Estate Agency</option>
                      <option>Independent Agent</option>
                      <option>Brokerage Firm</option>
                      <option>Property Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => {
                        setLicenseNumber(e.target.value);
                        setBusinessValidationError("");
                      }}
                      placeholder="Real estate license #"
                      className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Years of Experience
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    title="Years of experience"
                    aria-label="Years of experience"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                  >
                    <option>Less than 1 year</option>
                    <option>1-3 years</option>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                          title={area}
                          aria-label={area}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                        />
                        <span className="text-sm text-foreground">{area}</span>
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelRoleSetup}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleBusinessContinue()}
                    disabled={isSavingBusiness}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSavingBusiness ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* KYC Verification Tab */}
          <TabsContent value="kyc">
            <Card className="p-4 md:p-6 lg:p-8 bg-card border border-border">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">Identity Verification (KYC)</h2>
                <p className="text-muted-foreground">
                  Upload required documents to verify your identity and get a verified badge
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Business License / Certificate is required for professional role applications.
                </p>
              </div>

              <div className="space-y-6">
                {/* ID Card */}
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Government-Issued ID</h3>
                        <p className="text-sm text-muted-foreground">
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
                    onClick={() => document.getElementById("profile-setup-id-card")?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.idCard ? "Replace Document" : "Upload Document"}
                  </Button>
                  <input
                    id="profile-setup-id-card"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    title="Upload government ID"
                    aria-label="Upload government ID"
                    onChange={(event) => handleKycFileUpload("idCard", event.target.files?.[0] ?? null)}
                  />
                </div>

                {/* Business License */}
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Business License / Certificate</h3>
                        <p className="text-sm text-muted-foreground">
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
                      <div className={`flex items-center gap-2 ${isBusinessLicenseRequired ? "text-orange-600" : "text-muted-foreground"}`}>
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{isBusinessLicenseRequired ? "Required" : "Optional"}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("profile-setup-business-license")?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.businessLicense ? "Replace Document" : "Upload Document"}
                  </Button>
                  <input
                    id="profile-setup-business-license"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    title="Upload business license"
                    aria-label="Upload business license"
                    onChange={(event) => handleKycFileUpload("businessLicense", event.target.files?.[0] ?? null)}
                  />
                </div>

                {/* Proof of Address */}
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Proof of Address</h3>
                        <p className="text-sm text-muted-foreground">
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
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Optional</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("profile-setup-proof-address")?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedDocs.proofOfAddress ? "Replace Document" : "Upload Document"}
                  </Button>
                  <input
                    id="profile-setup-proof-address"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    title="Upload proof of address"
                    aria-label="Upload proof of address"
                    onChange={(event) => handleKycFileUpload("proofOfAddress", event.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {kycSubmitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {kycSubmitError}
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm text-foreground">
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelRoleSetup}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={!uploadedDocs.idCard || (isBusinessLicenseRequired && !uploadedDocs.businessLicense) || isSubmittingKyc}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingKyc ? "Submitting..." : "Submit for Verification"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}