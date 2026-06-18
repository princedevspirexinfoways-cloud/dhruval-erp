'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  Calendar,
  Users,
  Building,
  Moon,
  Sun,
  RotateCcw,
  Settings
} from 'lucide-react';
import { useGetAllShiftsQuery, useDeleteShiftMutation } from '@/lib/features/shifts/shiftApi';
import { Can } from '@/lib/casl/Can';
import { IShift } from '@/types/shifts';
import { toast } from 'react-hot-toast';

const ShiftPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<IShift | null>(null);

  // RTK Query hooks
  const { data: shiftData, isLoading, error, refetch } = useGetAllShiftsQuery({
    search: searchTerm,
    shiftType: shiftTypeFilter,
    shiftCategory: categoryFilter,
  });

  const [deleteShift] = useDeleteShiftMutation();

  const shifts = shiftData?.data || [];

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = !searchTerm || 
      shift.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.shiftCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeleteShift = async (shiftId: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await deleteShift(shiftId).unwrap();
        toast.success('Shift deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete shift');
        console.error('Delete failed:', error);
      }
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'day': return 'bg-blue-100 text-blue-800';
      case 'night': return 'bg-indigo-100 text-indigo-800';
      case 'general': return 'bg-green-100 text-green-800';
      case 'rotating': return 'bg-purple-100 text-purple-800';
      case 'flexible': return 'bg-yellow-100 text-yellow-800';
      case 'split': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'production': return 'bg-blue-100 text-blue-800';
      case 'office': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return time; // Assuming time is already in HH:MM format
  };

  const getShiftIcon = (shift: IShift) => {
    if (shift.isNightShift) return <Moon className="w-4 h-4 text-indigo-600" />;
    if (shift.shiftType === 'rotating') return <RotateCcw className="w-4 h-4 text-purple-600" />;
    if (shift.shiftType === 'flexible') return <Settings className="w-4 h-4 text-yellow-600" />;
    return <Sun className="w-4 h-4 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading shifts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg">Error loading shifts</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 mt-2">Manage work shifts, schedules, and employee assignments</p>
        </div>
        <Can I="create" a="Shift">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
        </Can>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold">{shifts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Moon className="w-8 h-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Night Shifts</p>
                <p className="text-2xl font-bold">
                  {shifts.filter(shift => shift.isNightShift).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active Shifts</p>
                <p className="text-2xl font-bold">
                  {shifts.filter(shift => shift.isDefault !== false).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(shifts.map(shift => shift.shiftCategory)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search shifts by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={shiftTypeFilter}
              onChange={(e) => setShiftTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
              <option value="general">General</option>
              <option value="rotating">Rotating</option>
              <option value="flexible">Flexible</option>
              <option value="split">Split</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="production">Production</option>
              <option value="office">Office</option>
              <option value="security">Security</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>

            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            <Button variant="outline" className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shifts ({filteredShifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Shift</th>
                  <th className="text-left p-3 font-semibold">Timing</th>
                  <th className="text-left p-3 font-semibold">Type & Category</th>
                  <th className="text-left p-3 font-semibold">Details</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.map((shift) => (
                  <tr key={shift._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getShiftIcon(shift)}
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold">{shift.shiftName}</p>
                          <p className="text-sm text-gray-600">{shift.shiftCode}</p>
                          {shift.isDefault && (
                            <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </p>
                        <p className="text-gray-600">
                          {shift.totalHours} hours ({shift.netWorkingHours} net)
                        </p>
                        {shift.totalBreakTime > 0 && (
                          <p className="text-xs text-gray-500">
                            {shift.totalBreakTime} min breaks
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <Badge className={getShiftTypeColor(shift.shiftType)}>
                          {shift.shiftType}
                        </Badge>
                        <Badge className={getCategoryColor(shift.shiftCategory)}>
                          {shift.shiftCategory}
                        </Badge>
                        {shift.isNightShift && (
                          <Badge className="bg-indigo-100 text-indigo-800">
                            Night Shift
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Priority:</span> {shift.priority}
                        </p>
                        <p>
                          <span className="font-medium">Min Employees:</span> {shift.minimumEmployees}
                        </p>
                        <p>
                          <span className="font-medium">Max Employees:</span> {shift.maximumEmployees}
                        </p>
                        {shift.weeklySchedule && shift.weeklySchedule.length > 0 && (
                          <p>
                            <span className="font-medium">Working Days:</span> {shift.weeklySchedule.filter(s => s.isWorkingDay).length}
                          </p>
                        )}
                        {shift.overtimeThreshold > 0 && (
                          <p>
                            <span className="font-medium">Overtime:</span> {shift.overtimeThreshold / 60}h
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Can I="read" a="Shift">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedShift(shift)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="update" a="Shift">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedShift(shift);
                              setShowCreateModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="delete" a="Shift">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteShift(shift._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredShifts.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No shifts found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedShift ? 'Edit Shift' : 'Add New Shift'}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedShift(null);
                }}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Shift form will be implemented here with all required fields
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedShift(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedShift ? 'Update Shift' : 'Create Shift'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Shift Modal Placeholder */}
      {selectedShift && !showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Shift Details</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedShift(null)}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Detailed shift view will be implemented here
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedShift(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftPage;
