import { User, Briefcase, Wrench, Building2, Shield, Package, FileCheck, ClipboardCheck } from "lucide-react";

interface RoleBadgeProps {
  role: "buyer" | "agent" | "contractor" | "property_manager" | "admin" | "supplier" | "conveyancer" | "inspector";
  size?: "sm" | "md" | "lg";
}

const roleConfig = {
  buyer: {
    label: "Buyer",
    icon: User,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  agent: {
    label: "Agent",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  contractor: {
    label: "Contractor",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  property_manager: {
    label: "Property Manager",
    icon: Building2,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-red-100 text-red-700 border-red-200",
  },
  supplier: {
    label: "Supplier",
    icon: Package,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  conveyancer: {
    label: "Conveyancer",
    icon: FileCheck,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  inspector: {
    label: "Inspector",
    icon: ClipboardCheck,
    color: "bg-teal-100 text-teal-700 border-teal-200",
  },
};

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const config = roleConfig[role];
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
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}