'use client';

import { CheckSquare, Gift, Mail, Star, Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import { AddActivityModal } from './AddActivityModal';
import { EditActivityModal } from './EditActivityModal';

interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'pending' | 'scheduled';
  category: string;
}

interface Props { propertyId: string; authToken: string; }

export function PostSaleActivities({ propertyId: _propertyId, authToken: _authToken }: Props) {
  const [activities, _setActivities] = useState<Activity[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Client Relations':
        return <Users className="w-4 h-4" />;
      case 'Marketing':
        return <Star className="w-4 h-4" />;
      case 'Financial':
        return <CheckSquare className="w-4 h-4" />;
      case 'Administrative':
        return <Mail className="w-4 h-4" />;
      default:
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const groupedActivities = {
    pending: activities.filter(a => a.status === 'pending'),
    scheduled: activities.filter(a => a.status === 'scheduled'),
    completed: activities.filter(a => a.status === 'completed')
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Post-Sale Activities</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Activity
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900">Post-Sale Client Care</div>
            <p className="text-sm text-blue-800 mt-1">
              Stay connected with your clients after closing to build lasting relationships and generate referrals.
              Complete these activities to ensure exceptional service.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700 mb-1">Action Required</div>
          <div className="text-2xl font-semibold text-yellow-600">{groupedActivities.pending.length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 mb-1">Scheduled</div>
          <div className="text-2xl font-semibold text-blue-600">{groupedActivities.scheduled.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700 mb-1">Completed</div>
          <div className="text-2xl font-semibold text-green-600">{groupedActivities.completed.length}</div>
        </div>
      </div>

      {activities.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No post-sale activities yet</p>
          <p className="text-xs text-gray-400 mt-1">Add activities to track post-closing follow-ups</p>
        </div>
      )}

      {/* Pending Activities */}
      {groupedActivities.pending.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-red-600">⚠️ Action Required</h3>
          <div className="space-y-3">
            {groupedActivities.pending.map((activity) => (
              <div key={activity.id} className="bg-white border-2 border-yellow-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-3 flex-1 cursor-pointer"
                    onClick={() => setEditingActivity(activity)}
                  >
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(activity.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{activity.title}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {activity.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap ml-3">
                    Mark Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Activities */}
      {groupedActivities.scheduled.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Upcoming Activities</h3>
          <div className="space-y-3">
            {groupedActivities.scheduled.map((activity) => (
              <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start gap-3 flex-1 cursor-pointer"
                    onClick={() => setEditingActivity(activity)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(activity.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{activity.title}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {activity.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Scheduled: {new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)} whitespace-nowrap ml-3`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-2">Post-Sale Best Practices</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Stay in touch with clients for at least 2 years after closing</li>
          <li>• Personalize your communications - reference specific details about their transaction</li>
          <li>• Provide value beyond the sale: home maintenance tips, local contractor referrals, market updates</li>
          <li>• Request reviews and testimonials while the positive experience is fresh</li>
          <li>• Past clients are your best source of referrals - nurture these relationships</li>
        </ul>
      </div>

      <AddActivityModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
      <EditActivityModal
        open={editingActivity !== null}
        onOpenChange={(open) => {
          if (!open) setEditingActivity(null);
        }}
        activity={editingActivity}
      />
    </div>
  );
}
