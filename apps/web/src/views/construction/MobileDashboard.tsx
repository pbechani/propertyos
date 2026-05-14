'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  Circle,
  Camera,
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Plus,
  Bell,
  Menu,
  Calendar,
  ClipboardList,
  ImagePlus,
  ShoppingCart,
  Shield,
  Mic,
  CheckSquare,
  XCircle,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { Link } from '@/lib/router-compat';

export function MobileDashboard() {
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMaterialRequest, setShowMaterialRequest] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const todaysTasks = [
    {
      id: 1,
      title: 'Concrete Pour - Level 5',
      location: 'Metropolitan Heights Tower',
      status: 'in-progress',
      priority: 'high',
      dueTime: '10:00 AM',
      assignedTo: 'David Chen',
      progress: 65,
      description: 'Complete concrete pour for fifth floor foundation'
    },
    {
      id: 2,
      title: 'Rebar Inspection',
      location: 'Metropolitan Heights Tower',
      status: 'pending',
      priority: 'high',
      dueTime: '11:30 AM',
      assignedTo: 'Jennifer Martinez',
      progress: 0,
      description: 'Quality check of reinforcement bars'
    },
    {
      id: 3,
      title: 'Electrical Rough-In',
      location: 'Level 3',
      status: 'pending',
      priority: 'medium',
      dueTime: '2:00 PM',
      assignedTo: 'Thomas Wilson',
      progress: 0,
      description: 'Install electrical conduits and boxes'
    },
    {
      id: 4,
      title: 'Safety Walkthrough',
      location: 'Entire Site',
      status: 'completed',
      priority: 'high',
      dueTime: '7:00 AM',
      assignedTo: 'Robert Lee',
      progress: 100,
      description: 'Daily safety inspection completed'
    }
  ];

  const materialRequests = [
    {
      id: 1,
      material: 'Portland Cement',
      quantity: '50 bags',
      urgency: 'urgent',
      requestedBy: 'Site Foreman',
      location: 'Level 5',
      status: 'pending'
    },
    {
      id: 2,
      material: 'Rebar #4',
      quantity: '200 units',
      urgency: 'normal',
      requestedBy: 'Steel Crew',
      location: 'Level 6',
      status: 'approved'
    },
    {
      id: 3,
      material: 'Plywood Sheets',
      quantity: '30 sheets',
      urgency: 'urgent',
      requestedBy: 'Carpentry Team',
      location: 'Level 4',
      status: 'pending'
    }
  ];

  const safetyAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Crane Operation Alert',
      description: 'High winds expected between 2-4 PM. Suspend crane operations.',
      time: '30 min ago',
      location: 'Tower Crane 1',
      acknowledged: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'PPE Violation',
      description: 'Worker spotted without hard hat in active construction zone.',
      time: '1 hour ago',
      location: 'Level 3',
      acknowledged: true
    },
    {
      id: 3,
      type: 'info',
      title: 'Weather Advisory',
      description: 'Rain expected tomorrow. Prepare waterproofing measures.',
      time: '2 hours ago',
      location: 'All Areas',
      acknowledged: true
    }
  ];

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'pending': return <Circle className="w-5 h-5 text-gray-400" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <AlertCircleIcon className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Menu className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Construction Site</h1>
                <p className="text-xs text-blue-100">Metropolitan Heights Tower</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-blue-100">Thursday, March 12, 2026</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              <Clock className="w-3 h-3 mr-1" />
              10:45 AM
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-4 gap-3">
          <Link to="/construction/mobile-site-log">
            <button className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors w-full">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-900 text-center">Site Log</span>
            </button>
          </Link>
          
          <button 
            onClick={() => setShowPhotoUpload(true)}
            className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Photos</span>
          </button>

          <button 
            onClick={() => setShowMaterialRequest(true)}
            className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-md">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Request</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Safety</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Today's Tasks */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                Today's Tasks
                <Badge variant="secondary">{todaysTasks.length}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setShowTaskDetails(true);
                }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    {getTaskStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{task.location}</span>
                      </div>
                      {task.status === 'in-progress' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span className="font-medium">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge className={getTaskStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{task.dueTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Site Photo Upload */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-purple-600" />
              Site Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900 mb-1">Upload Site Photos</p>
                  <p className="text-sm text-gray-500">Tap to capture or select photos</p>
                </div>
              </div>
            </button>
            
            {/* Recent Photos Preview */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Recent Photos (Today)</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-50"></div>
                    <div className="absolute bottom-1 right-1">
                      <Badge className="bg-black/50 text-white text-xs">
                        {10 + i}:30 AM
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Requests */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-green-600" />
                Material Requests
                <Badge className="bg-red-100 text-red-800">
                  {materialRequests.filter(m => m.urgency === 'urgent').length} Urgent
                </Badge>
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowMaterialRequest(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {materialRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {request.material}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Quantity: <span className="font-medium">{request.quantity}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{request.location}</span>
                      <span>•</span>
                      <User className="w-3 h-3" />
                      <span>{request.requestedBy}</span>
                    </div>
                  </div>
                  {getUrgencyBadge(request.urgency)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety Alerts */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="pb-3 bg-red-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-red-600" />
              Safety Alerts
              <Badge className="bg-red-600 text-white">
                {safetyAlerts.filter(a => !a.acknowledged).length} New
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {safetyAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowAlertDetails(true);
                }}
                className={`p-4 rounded-lg border-2 ${getAlertColor(alert.type)} ${
                  !alert.acknowledged ? 'shadow-md' : 'opacity-75'
                } active:scale-98 transition-all`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {alert.title}
                      </h3>
                      {!alert.acknowledged && (
                        <Badge className="bg-red-600 text-white ml-2">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{alert.location}</span>
                      </div>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">{selectedTask.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={getTaskStatusColor(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} bg-opacity-10`}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Due Time</p>
                  <p className="text-sm font-medium">{selectedTask.dueTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                  <p className="text-sm font-medium">{selectedTask.assignedTo}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-sm font-medium">{selectedTask.location}</p>
              </div>

              {selectedTask.status === 'in-progress' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Progress</p>
                    <p className="text-sm font-bold">{selectedTask.progress}%</p>
                  </div>
                  <Progress value={selectedTask.progress} className="h-3" />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" variant="outline">
                  Update Status
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Mark Complete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Site Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-24 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                <Camera className="w-8 h-8" />
                <span>Take Photo</span>
              </Button>
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <ImagePlus className="w-8 h-8" />
                <span>From Gallery</span>
              </Button>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Photos are automatically tagged with location and timestamp.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Request Dialog */}
      <Dialog open={showMaterialRequest} onOpenChange={setShowMaterialRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Material Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Quick request form for on-site materials</p>
            <div className="space-y-3">
              <Button className="w-full justify-start h-12 text-left" variant="outline">
                <Package className="w-5 h-5 mr-3" />
                Select Material Type
              </Button>
              <Button className="w-full justify-start h-12 text-left" variant="outline">
                <MapPin className="w-5 h-5 mr-3" />
                Delivery Location
              </Button>
              <Button className="w-full justify-start h-12 text-left bg-green-600 hover:bg-green-700 text-white">
                <Mic className="w-5 h-5 mr-3" />
                Voice Request (Quick)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Alert Details Dialog */}
      <Dialog open={showAlertDetails} onOpenChange={setShowAlertDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Safety Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className={`p-4 rounded-lg ${getAlertColor(selectedAlert.type)} border-2`}>
              <div className="flex items-start gap-3 mb-4">
                {getAlertIcon(selectedAlert.type)}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{selectedAlert.title}</h3>
                  <p className="text-sm text-gray-700">{selectedAlert.description}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{selectedAlert.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedAlert.time}</span>
                </div>
              </div>
              {!selectedAlert.acknowledged && (
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge Alert
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
