'use client';
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "rejected" | "unverified";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  verified: {
    label: "Verified",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 border-green-200",
    iconColor: "text-green-600",
  },
  pending: {
    label: "Pending Verification",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    iconColor: "text-yellow-600",
  },
  rejected: {
    label: "Verification Failed",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-200",
    iconColor: "text-red-600",
  },
  unverified: {
    label: "Not Verified",
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    iconColor: "text-gray-600",
  },
};

export function VerificationBadge({
  status,
  size = "md",
  showLabel = true,
}: VerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
      {showLabel && config.label}
    </span>
  );
}
