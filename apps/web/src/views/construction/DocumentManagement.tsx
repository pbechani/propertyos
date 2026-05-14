'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  FolderOpen,
  Upload,
  Download,
  Search,
  MoreVertical,
  Eye,
  Share2,
  Clock,
  CheckCircle,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCheck,
  Home,
  Building2,
  Zap,
  HelpCircle,
  Send,
  BarChart3,
  Camera,
  ChevronRight,
  ChevronDown,
  User,
  Calendar,
  Tag,
  Lock,
  Unlock,
  Globe,
  Shield,
  History
} from 'lucide-react';
import { documentFolders, documents, documentActivities, documentStats } from '@/views/construction/data/documents';
import type { Document, DocumentFolder } from '@/views/construction/types';

const iconMap: Record<string, any> = {
  FileText,
  Home,
  Building2,
  Zap,
  FileCheck,
  HelpCircle,
  Send,
  BarChart3,
  Camera,
  FileSpreadsheet,
  ClipboardCheck: FileCheck,
  Leaf: Globe,
  FileSignature: FileText,
  Files: FolderOpen
};

const fileTypeIcons: Record<string, any> = {
  pdf: FileText,
  dwg: FileText,
  xlsx: FileSpreadsheet,
  docx: FileText,
  jpg: ImageIcon,
  png: ImageIcon,
  rvt: FileText,
  ifc: FileText,
  other: File
};

export function DocumentManagement() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['plans', 'permits', 'contracts']));
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Get root folders
  const rootFolders = documentFolders.filter(f => f.parentId === null);

  // Get subfolders for a folder
  const getSubfolders = (folderId: string) => {
    return documentFolders.filter(f => f.parentId === folderId);
  };

  // Get documents for selected folder
  const folderDocuments = documents.filter(d => {
    if (!selectedFolder) return false;
    
    // Include documents from selected folder and its subfolders
    const folder = documentFolders.find(f => f.id === selectedFolder);
    if (!folder) return false;
    
    const subfolderIds = getSubfolders(selectedFolder).map(f => f.id);
    return d.folderId === selectedFolder || subfolderIds.includes(d.folderId);
  });

  // Filter documents
  const filteredDocuments = folderDocuments.filter(doc => {
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    if (filterType !== 'all' && doc.type !== filterType) return false;
    return true;
  });

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'internal':
        return <Unlock className="w-4 h-4 text-green-600" />;
      case 'confidential':
        return <Lock className="w-4 h-4 text-orange-600" />;
      case 'restricted':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <Lock className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderFolderTree = (folder: DocumentFolder, level: number = 0) => {
    const subfolders = getSubfolders(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const IconComponent = iconMap[folder.icon] || FolderOpen;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          {subfolders.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {subfolders.length === 0 && <div className="w-5" />}
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${folder.color}20` }}
          >
            <IconComponent className="w-4 h-4" style={{ color: folder.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
            <p className="text-xs text-gray-500">{folder.documentCount} files</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {folder.totalSize}
          </Badge>
        </div>

        {isExpanded && subfolders.map(subfolder => renderFolderTree(subfolder, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 mt-1">Centralized document repository with version control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <Badge variant="secondary">{documentStats.totalDocuments}</Badge>
            </div>
            <p className="text-sm text-gray-600">Total Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              <Badge variant="secondary">{documentStats.totalFolders}</Badge>
            </div>
            <p className="text-sm text-gray-600">Folders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <Badge variant="secondary">{documentStats.totalSize}</Badge>
            </div>
            <p className="text-sm text-gray-600">Total Size</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <Badge className="bg-yellow-100 text-yellow-800">{documentStats.pendingApprovals}</Badge>
            </div>
            <p className="text-sm text-gray-600">Pending Review</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800">{documentStats.approvedToday}</Badge>
            </div>
            <p className="text-sm text-gray-600">Approved Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Upload className="w-5 h-5 text-cyan-600" />
              <Badge className="bg-cyan-100 text-cyan-800">{documentStats.recentUploads}</Badge>
            </div>
            <p className="text-sm text-gray-600">Recent Uploads</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Folder Tree Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1">
                {rootFolders.map(folder => renderFolderTree(folder))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {documentActivities.slice(0, 5).map((activity) => {
                  const doc = documents.find(d => d.id === activity.documentId);
                  return (
                    <div key={activity.id} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5">
                        {activity.action === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {activity.action === 'uploaded' && <Upload className="w-4 h-4 text-blue-600" />}
                        {activity.action === 'viewed' && <Eye className="w-4 h-4 text-gray-600" />}
                        {activity.action === 'shared' && <Share2 className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{doc?.name}</p>
                        <p className="text-gray-500 text-xs">
                          {activity.action} by {activity.user}
                        </p>
                        <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <div className="col-span-12 lg:col-span-9">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {selectedFolder ? (
                    <>
                      <FolderOpen className="w-5 h-5" />
                      {documentFolders.find(f => f.id === selectedFolder)?.name}
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      All Documents
                    </>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  >
                    {viewMode === 'list' ? 'Grid View' : 'List View'}
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending-review">Pending Review</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="dwg">DWG</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                    <SelectItem value="docx">Word</SelectItem>
                    <SelectItem value="jpg">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {!selectedFolder ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a folder to view documents</p>
                  <p className="text-sm mt-1">Choose a folder from the sidebar to browse files</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No documents found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => {
                    const FileIcon = fileTypeIcons[doc.type] || File;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        {/* File Icon */}
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-6 h-6 text-blue-600" />
                        </div>

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                            <Badge className={getStatusBadge(doc.status)}>
                              {doc.status.replace('-', ' ')}
                            </Badge>
                            {doc.isCriticalPath && (
                              <Badge className="bg-orange-100 text-orange-800">Critical</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {doc.uploadedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {doc.lastModified}
                            </span>
                            <span className="flex items-center gap-1">
                              <History className="w-3 h-3" />
                              v{doc.version}
                            </span>
                            <span>{doc.size}</span>
                            <span className="flex items-center gap-1">
                              {getAccessLevelIcon(doc.accessLevel)}
                              {doc.accessLevel}
                            </span>
                          </div>
                          {doc.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {doc.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Details Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    {React.createElement(fileTypeIcons[selectedDocument.type] || File, {
                      className: "w-6 h-6 text-blue-600"
                    })}
                  </div>
                  <div>
                    <DialogTitle>{selectedDocument.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusBadge(selectedDocument.status)}>
                        {selectedDocument.status.replace('-', ' ')}
                      </Badge>
                      <span className="text-sm">Version {selectedDocument.version}</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="versions">
                  Version History ({selectedDocument.versionHistory.length})
                </TabsTrigger>
                <TabsTrigger value="approvals">
                  Approvals {selectedDocument.approvers && `(${selectedDocument.approvers.length})`}
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">File Size</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDocument.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">File Type</p>
                    <p className="text-sm font-medium text-gray-900 uppercase">{selectedDocument.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Uploaded By</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDocument.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Upload Date</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDocument.uploadedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Modified</p>
                    <p className="text-sm font-medium text-gray-900">{selectedDocument.lastModified}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Access Level</p>
                    <div className="flex items-center gap-1">
                      {getAccessLevelIcon(selectedDocument.accessLevel)}
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedDocument.accessLevel}</p>
                    </div>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedDocument.description}
                    </p>
                  </div>
                )}

                {selectedDocument.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Version History Tab */}
              <TabsContent value="versions" className="space-y-3">
                {selectedDocument.versionHistory.map((version, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">Version {version.version}</h4>
                        <p className="text-sm text-gray-600 mt-1">{version.changes}</p>
                      </div>
                      <Badge variant="outline">{version.size}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.uploadedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {version.uploadedDate}
                      </span>
                    </div>
                    {idx === 0 && (
                      <Badge className="mt-2 bg-blue-100 text-blue-800">Current</Badge>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* Approvals Tab */}
              <TabsContent value="approvals" className="space-y-3">
                {selectedDocument.approvers && selectedDocument.approvers.length > 0 ? (
                  selectedDocument.approvers.map((approver, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{approver.name}</p>
                            {approver.date && (
                              <p className="text-sm text-gray-500">{approver.date}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          approver.status === 'approved' ? 'bg-green-100 text-green-800' :
                          approver.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {approver.status}
                        </Badge>
                      </div>
                      {approver.comments && (
                        <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded">
                          {approver.comments}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No approvals required</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <div className="flex gap-2 w-full justify-between">
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload new documents to the selected folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Folder Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Destination Folder</label>
              <Select defaultValue={selectedFolder || 'plans'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, DWG, XLSX, DOCX, Images up to 100MB</p>
            </div>

            {/* Document Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Document Name</label>
                <Input placeholder="Enter document name" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description (Optional)</label>
                <Input placeholder="Brief description" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Access Level</label>
                <Select defaultValue="internal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                <Input placeholder="Add tags (comma separated)" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setUploadDialogOpen(false)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}