import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { systemModules } from '@/views/construction/data/users';
import type { Role } from '@/views/construction/types';

interface PermissionMatrixProps {
  roles: Role[];
}

export function PermissionMatrix({ roles }: PermissionMatrixProps) {
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [localRoles, setLocalRoles] = useState(roles);

  const filteredRoles = selectedRole === 'all' 
    ? localRoles 
    : localRoles.filter(r => r.id === selectedRole);

  const handlePermissionToggle = (roleId: string, moduleId: string, permission: 'view' | 'create' | 'edit' | 'delete') => {
    if (!editMode) return;
    
    setLocalRoles(localRoles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [moduleId]: {
              ...role.permissions[moduleId],
              [permission]: !role.permissions[moduleId]?.[permission]
            }
          }
        };
      }
      return role;
    }));
  };

  const handleSave = () => {
    console.log('Saving permissions...', localRoles);
    setEditMode(false);
  };

  const handleReset = () => {
    setLocalRoles(roles);
    setEditMode(false);
  };

  const getRoleColor = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    switch (role?.color) {
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionCount = (role: Role) => {
    let total = 0;
    Object.values(role.permissions).forEach(perms => {
      if (perms.view) total++;
      if (perms.create) total++;
      if (perms.edit) total++;
      if (perms.delete) total++;
    });
    return total;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Permission Matrix</h2>
          <p className="text-gray-500 mt-1">Configure access permissions for each role</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Permissions
            </Button>
          )}
        </div>
      </div>

      {/* Role Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editMode && (
              <Badge className="bg-blue-100 text-blue-800">
                Edit Mode Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRoles.map((role) => (
          <Card key={role.id} className={`border-2 ${getRoleColor(role.id)}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className={`w-6 h-6 ${role.color === 'purple' ? 'text-purple-600' : role.color === 'blue' ? 'text-blue-600' : role.color === 'green' ? 'text-green-600' : role.color === 'orange' ? 'text-orange-600' : 'text-gray-600'}`} />
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                    <Badge variant="secondary">{role.userCount} users</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <Badge className="bg-white border">
                  {getPermissionCount(role)} permissions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[200px]">
                        Module
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                        <div className="flex flex-col items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                        <div className="flex flex-col items-center gap-1">
                          <Plus className="w-4 h-4" />
                          <span>Create</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                        <div className="flex flex-col items-center gap-1">
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 w-24">
                        <div className="flex flex-col items-center gap-1">
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {systemModules.map((module) => {
                      const permissions = role.permissions[module.id] || {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false
                      };

                      return (
                        <tr key={module.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{module.name}</p>
                              <p className="text-xs text-gray-500">{module.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PermissionCheckbox
                              checked={permissions.view}
                              onChange={() => handlePermissionToggle(role.id, module.id, 'view')}
                              disabled={!editMode}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PermissionCheckbox
                              checked={permissions.create}
                              onChange={() => handlePermissionToggle(role.id, module.id, 'create')}
                              disabled={!editMode}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PermissionCheckbox
                              checked={permissions.edit}
                              onChange={() => handlePermissionToggle(role.id, module.id, 'edit')}
                              disabled={!editMode}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <PermissionCheckbox
                              checked={permissions.delete}
                              onChange={() => handlePermissionToggle(role.id, module.id, 'delete')}
                              disabled={!editMode}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View</p>
                <p className="text-xs text-gray-500">Read and view data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create</p>
                <p className="text-xs text-gray-500">Add new records</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Edit</p>
                <p className="text-xs text-gray-500">Modify existing data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Delete</p>
                <p className="text-xs text-gray-500">Remove records</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Permission Checkbox Component
function PermissionCheckbox({ 
  checked, 
  onChange, 
  disabled 
}: { 
  checked: boolean; 
  onChange: () => void; 
  disabled: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
        checked
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white border-gray-300 hover:border-gray-400'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      {checked && <CheckCircle className="w-4 h-4 text-white" />}
    </button>
  );
}
