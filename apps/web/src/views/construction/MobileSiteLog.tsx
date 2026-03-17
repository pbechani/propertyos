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
  ArrowLeft,
  Camera,
  Mic,
  StopCircle,
  Play,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Thermometer,
  Image as ImageIcon,
  Save,
  Send,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Link } from '@/lib/router-compat';

export function MobileSiteLog() {
  const [workCompleted, setWorkCompleted] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [weatherCondition, setWeatherCondition] = useState('');
  const [temperature, setTemperature] = useState('');
  const [crewCount, setCrewCount] = useState('');
  const [equipmentUsed, setEquipmentUsed] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleAddPhoto = () => {
    const newPhoto = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      caption: ''
    };
    setPhotos([...photos, newPhoto]);
  };

  const handleRemovePhoto = (id: number) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      const newNote = {
        id: Date.now(),
        duration: recordingTime,
        timestamp: new Date().toLocaleTimeString()
      };
      setVoiceNotes([...voiceNotes, newNote]);
      setRecordingTime(0);
    }
    setIsRecording(!isRecording);
  };

  const handleRemoveVoiceNote = (id: number) => {
    setVoiceNotes(voiceNotes.filter(n => n.id !== id));
  };

  const handleAddIssue = () => {
    const newIssue = {
      id: Date.now(),
      description: '',
      severity: 'medium',
      location: '',
      assignedTo: ''
    };
    setIssues([...issues, newIssue]);
  };

  const handleRemoveIssue = (id: number) => {
    setIssues(issues.filter(i => i.id !== id));
  };

  const handleUpdateIssue = (id: number, field: string, value: string) => {
    setIssues(issues.map(issue => 
      issue.id === id ? { ...issue, [field]: value } : issue
    ));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...');
    // Implement draft save logic
  };

  const handleSubmit = () => {
    console.log('Submitting site log...');
    // Implement submit logic
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/construction/mobile-dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Daily Site Log</h1>
              <p className="text-xs text-blue-100">Metropolitan Heights Tower</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
          
          <div className="text-sm text-blue-100">
            {currentDate}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Info Section */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Site Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Weather</Label>
                <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Sunny</SelectItem>
                    <SelectItem value="cloudy">☁️ Cloudy</SelectItem>
                    <SelectItem value="rainy">🌧️ Rainy</SelectItem>
                    <SelectItem value="windy">💨 Windy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Temperature</Label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="72"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="h-12 pl-10"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">°F</span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Crew Count</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="12"
                    value={crewCount}
                    onChange={(e) => setCrewCount(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Equipment</Label>
                <Select value={equipmentUsed} onValueChange={setEquipmentUsed}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crane">Tower Crane</SelectItem>
                    <SelectItem value="excavator">Excavator</SelectItem>
                    <SelectItem value="concrete">Concrete Pump</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Completed Section */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Work Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe the work completed today...

Examples:
• Poured concrete for Level 5 floor slab
• Installed electrical conduits on Level 3
• Completed rebar inspection
• Finished HVAC rough-in"
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              className="min-h-[180px] text-base resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{workCompleted.length} characters</p>
              <Button variant="ghost" size="sm" className="text-blue-600">
                <Mic className="w-4 h-4 mr-1" />
                Voice to Text
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="w-5 h-5 text-purple-600" />
                Site Photos
                {photos.length > 0 && (
                  <Badge variant="secondary">{photos.length}</Badge>
                )}
              </CardTitle>
              <Button size="sm" onClick={handleAddPhoto} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {photos.length === 0 ? (
              <button
                onClick={handleAddPhoto}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 mb-1">Capture Site Photos</p>
                    <p className="text-sm text-gray-500">Document progress, issues, or conditions</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Photo {index + 1}</p>
                            <p className="text-xs text-gray-500">{photo.timestamp}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemovePhoto(photo.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Add caption (optional)"
                          value={photo.caption}
                          onChange={(e) => {
                            const updated = photos.map(p =>
                              p.id === photo.id ? { ...p, caption: e.target.value } : p
                            );
                            setPhotos(updated);
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed"
                  onClick={handleAddPhoto}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Photo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Notes Section */}
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="w-5 h-5 text-blue-600" />
              Voice Notes
              {voiceNotes.length > 0 && (
                <Badge variant="secondary">{voiceNotes.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Recording Interface */}
            <div className={`p-6 rounded-lg border-2 ${
              isRecording 
                ? 'bg-red-50 border-red-300' 
                : 'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex flex-col items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                }`}>
                  {isRecording ? (
                    <StopCircle className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </div>
                
                {isRecording && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 mb-1">
                      {formatDuration(recordingTime)}
                    </p>
                    <p className="text-sm text-red-700">Recording in progress...</p>
                  </div>
                )}
                
                <Button
                  size="lg"
                  onClick={toggleRecording}
                  className={`w-full ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="w-5 h-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Saved Voice Notes */}
            {voiceNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Saved Notes</p>
                {voiceNotes.map((note, index) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" className="h-10 w-10 p-0">
                          <Play className="w-4 h-4" />
                        </Button>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Voice Note {index + 1}</p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(note.duration)} • {note.timestamp}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveVoiceNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues Section */}
        <Card className="shadow-lg border-2 border-orange-200">
          <CardHeader className="pb-3 bg-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Issues & Concerns
                {issues.length > 0 && (
                  <Badge className="bg-orange-600 text-white">{issues.length}</Badge>
                )}
              </CardTitle>
              <Button 
                size="sm" 
                onClick={handleAddIssue}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {issues.length === 0 ? (
              <button
                onClick={handleAddIssue}
                className="w-full p-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 mb-1">Report an Issue</p>
                    <p className="text-sm text-gray-500">Document problems or safety concerns</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div key={issue.id} className="p-4 bg-white rounded-lg border-2 border-orange-200">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-medium text-gray-900 text-sm">Issue {index + 1}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveIssue(issue.id)}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Severity</Label>
                        <Select
                          value={issue.severity}
                          onValueChange={(value) => handleUpdateIssue(issue.id, 'severity', value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🟢 Low - Minor</SelectItem>
                            <SelectItem value="medium">🟡 Medium - Moderate</SelectItem>
                            <SelectItem value="high">🔴 High - Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Description</Label>
                        <Textarea
                          placeholder="Describe the issue..."
                          value={issue.description}
                          onChange={(e) => handleUpdateIssue(issue.id, 'description', e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Location</Label>
                        <Input
                          placeholder="e.g., Level 3, North Wing"
                          value={issue.location}
                          onChange={(e) => handleUpdateIssue(issue.id, 'location', e.target.value)}
                          className="h-10"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Assign To</Label>
                        <Select
                          value={issue.assignedTo}
                          onValueChange={(value) => handleUpdateIssue(issue.id, 'assignedTo', value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="david">David Chen</SelectItem>
                            <SelectItem value="jennifer">Jennifer Martinez</SelectItem>
                            <SelectItem value="thomas">Thomas Wilson</SelectItem>
                            <SelectItem value="robert">Robert Lee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed border-orange-300 text-orange-700"
                  onClick={handleAddIssue}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Issue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="shadow-lg border-2 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <p className="font-medium text-blue-900">Entry Summary</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900">Work: {workCompleted ? '✓' : '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900">Photos: {photos.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900">Voice: {voiceNotes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-900">Issues: {issues.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={handleSaveDraft}
          >
            <Save className="w-5 h-5 mr-2" />
            Save Draft
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleSubmit}
          >
            <Send className="w-5 h-5 mr-2" />
            Submit Log
          </Button>
        </div>
      </div>
    </div>
  );
}
