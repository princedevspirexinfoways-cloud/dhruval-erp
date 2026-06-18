'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';

import { Plus, Search, Filter, Edit, Trash2, Eye, Users, Clock, Calendar, UserPlus, Download } from 'lucide-react';
import { 
  useGetManpowerQuery, 
  useCreateManpowerMutation, 
  useUpdateManpowerMutation, 
  useDeleteManpowerMutation 
} from '@/lib/features/manpower/manpowerApi';
import { Can } from '@/lib/casl/Can';

interface IManpower {
  _id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  employeeType: string;
  status: string;
  joiningDate: string;
  contactInfo: {
    phone: string;
    email?: string;
  };
  shiftDetails: {
    shiftType: string;
    startTime: string;
    endTime: string;
  };
}

const ManpowerPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IManpower | null>(null);

  // RTK Query hooks
  const { data: manpowerData, isLoading, error } = useGetManpowerQuery({
    department: departmentFilter || undefined,
    status: statusFilter || undefined
  });

  const [createManpower] = useCreateManpowerMutation();
  const [updateManpower] = useUpdateManpowerMutation();
  const [deleteManpower] = useDeleteManpowerMutation();

  const manpower = manpowerData?.data || [];

  const filteredManpower = manpower.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleCreateEmployee = async (formData: any) => {
    try {
      await createManpower(formData).unwrap();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create employee:', error);
    }
  };

  const handleUpdateEmployee = async (id: string, formData: any) => {
    try {
      await updateManpower({ id, data: formData }).unwrap();
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteManpower(id).unwrap();
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'resigned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'production': return 'bg-blue-100 text-blue-800';
      case 'packing': return 'bg-purple-100 text-purple-800';
      case 'quality': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-gray-100 text-gray-800';
      case 'sales': return 'bg-pink-100 text-pink-800';
      case 'purchase': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading manpower data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manpower Management</h1>
        <Can I="create" a="Manpower">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Can>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{manpower.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {manpower.filter(emp => emp.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {manpower.filter(emp => {
                    const joiningDate = new Date(emp.joiningDate);
                    const now = new Date();
                    return joiningDate.getMonth() === now.getMonth() && 
                           joiningDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(manpower.map(emp => emp.department)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                <option value="production">Production</option>
                <option value="packing">Packing</option>
                <option value="quality">Quality</option>
                <option value="maintenance">Maintenance</option>
                <option value="admin">Admin</option>
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="resigned">Resigned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Can I="read" a="Manpower">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </Can>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manpower Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employees ({filteredManpower.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Employee ID</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Designation</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Department</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Joining Date</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Contact</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredManpower.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="font-mono text-sm">{employee.employeeId}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="font-medium">{employee.name}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className="text-sm">{employee.designation}</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge className={getDepartmentColor(employee.department)}>
                        {employee.department}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className="text-sm capitalize">{employee.employeeType}</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className="text-sm">
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="text-sm">
                        <div>{employee.contactInfo.phone}</div>
                        {employee.contactInfo.email && (
                          <div className="text-gray-500">{employee.contactInfo.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex gap-2">
                        <Can I="read" a="Manpower">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="update" a="Manpower">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="delete" a="Manpower">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteEmployee(employee._id)}
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
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Can I="create" a="Manpower">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Employee Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCreateModal(true)}
              >
                Add New Employee
              </Button>
              <Button variant="outline" className="w-full">
                Bulk Import
              </Button>
              <Button variant="outline" className="w-full">
                Employee Templates
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Manpower">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                View Attendance
              </Button>
              <Button variant="outline" className="w-full">
                Attendance Report
              </Button>
              <Button variant="outline" className="w-full">
                Overtime Report
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Manpower">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Department Report
              </Button>
              <Button variant="outline" className="w-full">
                Status Report
              </Button>
              <Button variant="outline" className="w-full">
                Joining Report
              </Button>
            </CardContent>
          </Card>
        </Can>
      </div>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
            {/* Form would go here */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManpowerPage;
