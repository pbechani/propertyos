'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Users,
  CheckCircle,
  AlertTriangle,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  Send,
  Calendar,
  Thermometer,
  Camera
} from 'lucide-react';
import { mockProjects } from '@/views/construction/data/mockData';

export function DailySiteLog() {
  const [selectedProject, setSelectedProject] = useState('p1');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Weather state
  const [weatherCondition, setWeatherCondition] = useState('sunny');
  const [temperature, setTemperature] = useState('68');
  const [precipitation, setPrecipitation] = useState('none');

  // Workers state
  const [workerCategories, setWorkerCategories] = useState([
    { category: 'General Labor', count: 0 },
    { category: 'Electricians', count: 0 },
    { category: 'Plumbers', count: 0 },
    { category: 'Steel Workers', count: 0 }
  ]);

  // Work completed state
  const [workItems, setWorkItems] = useState([
    { id: '1', description: '', location: '', completionPercentage: 100 }
  ]);

  // Issues state
  const [issues, setIssues] = useState<any[]>([]);

  // Photos state
  const [photos, setPhotos] = useState<File[]>([]);
  const [notes, setNotes] = useState('');

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: Sun },
    { value: 'partly-cloudy', label: 'Partly Cloudy', icon: Cloud },
    { value: 'cloudy', label: 'Cloudy', icon: Cloud },
    { value: 'rainy', label: 'Rainy', icon: CloudRain },
    { value: 'snowy', label: 'Snowy', icon: CloudSnow },
    { value: 'windy', label: 'Windy', icon: Wind }
  ];

  const totalWorkers = workerCategories.reduce((sum, cat) => sum + cat.count, 0);

  const addWorkerCategory = () => {
    setWorkerCategories([...workerCategories, { category: '', count: 0 }]);
  };

  const updateWorkerCategory = (index: number, field: string, value: any) => {
    const updated = [...workerCategories];
    updated[index] = { ...updated[index], [field]: value };
    setWorkerCategories(updated);
  };

  const removeWorkerCategory = (index: number) => {
    setWorkerCategories(workerCategories.filter((_, i) => i !== index));
  };

  const addWorkItem = () => {
    setWorkItems([...workItems, {
      id: Date.now().toString(),
      description: '',
      location: '',
      completionPercentage: 100
    }]);
  };

  const updateWorkItem = (index: number, field: string, value: any) => {
    const updated = [...workItems];
    updated[index] = { ...updated[index], [field]: value };
    setWorkItems(updated);
  };

  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index));
  };

  const addIssue = () => {
    setIssues([...issues, {
      id: Date.now().toString(),
      type: 'other',
      severity: 'low',
      description: '',
      resolution: '',
      status: 'open'
    }]);
  };

  const updateIssue = (index: number, field: string, value: any) => {
    const updated = [...issues];
    updated[index] = { ...updated[index], [field]: value };
    setIssues(updated);
  };

  const removeIssue = (index: number) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Submit logic here
    alert('Site log submitted successfully!');
  };

  const handleSaveDraft = () => {
    // Save draft logic here
    alert('Draft saved!');
  };

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'delay': return 'bg-yellow-100 text-yellow-800';
      case 'quality': return 'bg-orange-100 text-orange-800';
      case 'equipment': return 'bg-blue-100 text-blue-800';
      case 'material': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Site Log</h1>
          <p className="text-gray-500 mt-1">Document daily construction activities and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>
      </div>

      {/* Project and Date Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Weather Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Condition</Label>
              <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperature (°F)</Label>
              <div className="relative mt-1">
                <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="pl-10"
                  placeholder="68"
                />
              </div>
            </div>
            <div>
              <Label>Precipitation</Label>
              <Select value={precipitation} onValueChange={setPrecipitation}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light-rain">Light Rain</SelectItem>
                  <SelectItem value="heavy-rain">Heavy Rain</SelectItem>
                  <SelectItem value="light-snow">Light Snow</SelectItem>
                  <SelectItem value="heavy-snow">Heavy Snow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers on Site */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Workers on Site
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800 text-lg px-3 py-1">
                Total: {totalWorkers}
              </Badge>
              <Button size="sm" variant="outline" onClick={addWorkerCategory}>
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workerCategories.map((category, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  placeholder="Category (e.g., Electricians)"
                  value={category.category}
                  onChange={(e) => updateWorkerCategory(index, 'category', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Count"
                  value={category.count}
                  onChange={(e) => updateWorkerCategory(index, 'count', parseInt(e.target.value) || 0)}
                  className="w-28"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeWorkerCategory(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Completed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Work Completed
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addWorkItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Description</Label>
                      <Textarea
                        placeholder="Describe the work completed..."
                        value={item.description}
                        onChange={(e) => updateWorkItem(index, 'description', e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600">Location</Label>
                        <Input
                          placeholder="e.g., Floor 10 - East Wing"
                          value={item.location}
                          onChange={(e) => updateWorkItem(index, 'location', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Completion %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.completionPercentage}
                          onChange={(e) => updateWorkItem(index, 'completionPercentage', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeWorkItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issues Encountered */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Issues Encountered
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addIssue}>
              <Plus className="w-4 h-4 mr-1" />
              Add Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No issues reported today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue, index) => (
                <div key={issue.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Type</Label>
                          <Select
                            value={issue.type}
                            onValueChange={(value) => updateIssue(index, 'type', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="safety">Safety</SelectItem>
                              <SelectItem value="delay">Delay</SelectItem>
                              <SelectItem value="quality">Quality</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Severity</Label>
                          <Select
                            value={issue.severity}
                            onValueChange={(value) => updateIssue(index, 'severity', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Status</Label>
                          <Select
                            value={issue.status}
                            onValueChange={(value) => updateIssue(index, 'status', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Description</Label>
                        <Textarea
                          placeholder="Describe the issue encountered..."
                          value={issue.description}
                          onChange={(e) => updateIssue(index, 'description', e.target.value)}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Resolution / Action Taken</Label>
                        <Textarea
                          placeholder="Describe how the issue was resolved or actions taken..."
                          value={issue.resolution}
                          onChange={(e) => updateIssue(index, 'resolution', e.target.value)}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getIssueTypeColor(issue.type)}>
                          {issue.type}
                        </Badge>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeIssue(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            Site Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional observations, comments, or notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" size="lg" onClick={handleSaveDraft}>
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button size="lg" onClick={handleSubmit}>
          <Send className="w-4 h-4 mr-2" />
          Submit Report
        </Button>
      </div>
    </div>
  );
}
