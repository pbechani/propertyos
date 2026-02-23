'use client';
import { CheckCircle, Clock, XCircle, AlertCircle, User } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "pending" | "error" | "info";
  user?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    lineColor: "bg-green-200",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    lineColor: "bg-yellow-200",
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    lineColor: "bg-red-200",
  },
  info: {
    icon: AlertCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    lineColor: "bg-blue-200",
  },
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const config = typeConfig[item.type];
        const Icon = config.icon;
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline Line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-10 w-0.5 h-full ${config.lineColor}`}
              ></div>
            )}

            {/* Icon */}
            <div
              className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <span className="text-xs text-gray-500">{item.timestamp}</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{item.description}</p>
              {item.user && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  {item.user}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
