'use client';
import { Circle } from "lucide-react";

interface StatusChipProps {
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dotColor: "text-yellow-500",
  },
  approved: {
    label: "Approved",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "text-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "text-red-500",
  },
  active: {
    label: "Active",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "text-blue-500",
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    dotColor: "text-gray-500",
  },
};

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
    >
      <Circle className={`${dotSizes[size]} ${config.dotColor} fill-current`} />
      {config.label}
    </span>
  );
}
