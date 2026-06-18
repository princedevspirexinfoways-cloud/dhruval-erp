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
  UserPlus,
  Users,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useGetAllEmployeesQuery, useDeleteEmployeeMutation } from '@/lib/features/employees/employeeApi';
import { Can } from '@/lib/casl/Can';
import { IEmployee } from '@/types/employees';
import { toast } from 'react-hot-toast';

const EmployeePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);

  // RTK Query hooks
  const { data: employeeData, isLoading, error, refetch } = useGetAllEmployeesQuery({
    search: searchTerm,
    department: departmentFilter,
    status: statusFilter,
  });

  const [deleteEmployee] = useDeleteEmployeeMutation();

  const employees = employeeData?.data || [];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.personalInfo.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employmentInfo.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(employeeId).unwrap();
        toast.success('Employee deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete employee');
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'resigned': return 'bg-orange-100 text-orange-800';
      case 'retired': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'production': 'bg-blue-100 text-blue-800',
      'packing': 'bg-green-100 text-green-800',
      'quality': 'bg-purple-100 text-purple-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'admin': 'bg-gray-100 text-gray-800',
      'sales': 'bg-indigo-100 text-indigo-800',
      'purchase': 'bg-pink-100 text-pink-800',
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg">Error loading employees</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-2">Manage all employees, their details, and employment information</p>
        </div>
        <Can I="create" a="Employee">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Can>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.employmentStatus === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => {
                    const joiningDate = new Date(emp.employmentInfo.joiningDate);
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
          <CardContent className="p-4">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">
                  {new Set(employees.map(emp => emp.employmentInfo.department)).size}
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
                  placeholder="Search employees by name, code, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
              <option value="retired">Retired</option>
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

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Employee</th>
                  <th className="text-left p-3 font-semibold">Department</th>
                  <th className="text-left p-3 font-semibold">Contact</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {employee.personalInfo.firstName?.[0]}{employee.personalInfo.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold">{employee.personalInfo.fullName}</p>
                          <p className="text-sm text-gray-600">{employee.employeeCode}</p>
                          <p className="text-xs text-gray-500">{employee.employmentInfo.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getDepartmentColor(employee.employmentInfo.department)}>
                        {employee.employmentInfo.department}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Joined: {new Date(employee.employmentInfo.joiningDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Phone className="w-3 h-3 mr-1" />
                        {employee.contactInfo.primaryPhone}
                      </div>
                      {employee.contactInfo.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {employee.contactInfo.email}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {employee.addresses.currentAddress.city}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(employee.employmentStatus)}>
                        {employee.employmentStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Can I="read" a="Employee">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="update" a="Employee">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowCreateModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Can>
                        
                        <Can I="delete" a="Employee">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee._id)}
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

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
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
                {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedEmployee(null);
                }}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Employee form will be implemented here with all required fields
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedEmployee ? 'Update Employee' : 'Create Employee'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal Placeholder */}
      {selectedEmployee && !showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Employee Details</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedEmployee(null)}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Detailed employee view will be implemented here
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedEmployee(null)}
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

export default EmployeePage;
