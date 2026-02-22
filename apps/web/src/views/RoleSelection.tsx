'use client';

import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { User, Briefcase, Wrench, Building2, Package, FileCheck, ClipboardCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: "buyer",
      name: "Buyer",
      icon: User,
      color: "blue",
      description: "Looking to buy or rent a property",
      features: [
        "Browse verified listings",
        "Save favorite properties",
        "Schedule property viewings",
        "Connect with verified agents",
      ],
    },
    {
      id: "agent",
      name: "Real Estate Agent",
      icon: Briefcase,
      color: "purple",
      description: "Professional real estate agent",
      features: [
        "List unlimited properties",
        "Manage client relationships",
        "Access advanced analytics",
        "Verified agent badge",
      ],
    },
    {
      id: "contractor",
      name: "Contractor",
      icon: Wrench,
      color: "orange",
      description: "Construction & renovation professional",
      features: [
        "Get project opportunities",
        "Showcase completed work",
        "Connect with property owners",
        "Build your reputation",
      ],
    },
    {
      id: "property_manager",
      name: "Property Manager",
      icon: Building2,
      color: "green",
      description: "Manage properties for owners",
      features: [
        "Manage multiple properties",
        "Tenant relationship tools",
        "Maintenance tracking",
        "Financial reporting",
      ],
    },
    {
      id: "supplier",
      name: "Supplier",
      icon: Package,
      color: "cyan",
      description: "Building materials & equipment supplier",
      features: [
        "List your products & services",
        "Connect with contractors",
        "Manage inventory",
        "Quote management system",
      ],
    },
    {
      id: "conveyancer",
      name: "Conveyancer",
      icon: FileCheck,
      color: "indigo",
      description: "Legal property transfer specialist",
      features: [
        "Manage property transfers",
        "Document verification",
        "Client case management",
        "Compliance tracking",
      ],
    },
    {
      id: "inspector",
      name: "Inspector",
      icon: ClipboardCheck,
      color: "teal",
      description: "Property inspection professional",
      features: [
        "Schedule inspections",
        "Digital report generation",
        "Photo documentation",
        "Client communication tools",
      ],
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pribec.pending_role", selectedRole);
      }
      navigate("/register");
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      blue: selected
        ? "border-blue-500 bg-blue-50"
        : "border-gray-200 hover:border-blue-300",
      purple: selected
        ? "border-purple-500 bg-purple-50"
        : "border-gray-200 hover:border-purple-300",
      orange: selected
        ? "border-orange-500 bg-orange-50"
        : "border-gray-200 hover:border-orange-300",
      green: selected
        ? "border-green-500 bg-green-50"
        : "border-gray-200 hover:border-green-300",
      cyan: selected
        ? "border-cyan-500 bg-cyan-50"
        : "border-gray-200 hover:border-cyan-300",
      indigo: selected
        ? "border-indigo-500 bg-indigo-50"
        : "border-gray-200 hover:border-indigo-300",
      teal: selected
        ? "border-teal-500 bg-teal-50"
        : "border-gray-200 hover:border-teal-300",
    };
    return colors[color as keyof typeof colors];
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
      cyan: "bg-cyan-100 text-cyan-600",
      indigo: "bg-indigo-100 text-indigo-600",
      teal: "bg-teal-100 text-teal-600",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Choose Your Role</h1>
          <p className="text-base md:text-xl text-gray-600 px-4">
            Select how you'll be using PropertyOS. You can change this later.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`p-5 md:p-6 cursor-pointer transition-all ${getColorClasses(
                  role.color,
                  isSelected
                )} border-2 relative`}
                onClick={() => setSelectedRole(role.id)}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 md:top-4 md:right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconColorClasses(
                      role.color
                    )}`}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold mb-1">{role.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {role.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center px-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 md:px-12 py-5 md:py-6 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs md:text-sm text-gray-500 mt-4">
            You can add additional roles later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}