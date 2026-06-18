'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Plus, Download } from 'lucide-react';
import { useGetAllAttendanceQuery, useCheckInMutation, useCheckOutMutation, useRecordBreakMutation } from '@/lib/features/manpower/attendanceApi';
import { useGetManpowerQuery } from '@/lib/features/manpower/manpowerApi';
import { Can } from '@/lib/casl/Can';

const AttendancePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // RTK Query hooks
  const { data: attendanceData, isLoading, error } = useGetAllAttendanceQuery({
    date: dateFilter,
    companyId: undefined // Will be handled by backend based on user role
  });

  const { data: manpowerData } = useGetManpowerQuery({});
  
  const [checkIn] = useCheckInMutation();
  const [checkOut] = useCheckOutMutation();
  const [recordBreak] = useRecordBreakMutation();

  const attendance = attendanceData?.data || [];
  const manpower = manpowerData?.data || [];

  const filteredAttendance = attendance.filter(record => {
    const employee = manpower.find(emp => emp._id === record.employeeId);
    const matchesSearch = !searchTerm || 
      employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = !employeeFilter || record.employeeId === employeeFilter;
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesEmployee && matchesStatus;
  });

  const handleCheckIn = async (employeeId: string) => {
    try {
      await checkIn({
        employeeId,
        location: 'Main Gate',
        method: 'mobile'
      }).unwrap();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      await checkOut({
        employeeId,
        location: 'Main Gate',
        method: 'mobile'
      }).unwrap();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  const handleBreak = async (employeeId: string, breakType: string) => {
    try {
      await recordBreak({
        employeeId,
        breakType,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min break
      }).unwrap();
    } catch (error) {
      console.error('Break recording failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      case 'half-day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      case 'leave': return <Calendar className="w-4 h-4" />;
      case 'half-day': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        <div className="text-red-500">Error loading attendance data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <Can I="create" a="Attendance">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Bulk Entry
          </Button>
        </Can>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select 
                value={employeeFilter} 
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {manpower.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
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
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">Leave</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Attendance Records - {formatDate(dateFilter)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Employee</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Check In</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Check Out</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Working Hours</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Overtime</th>
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => {
                  const employee = manpower.find(emp => emp._id === record.employeeId);
                  return (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">
                        <div>
                          <div className="font-medium">{employee?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{employee?.employeeId || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {record.checkIn?.time ? (
                          <div className="text-sm">
                            {new Date(record.checkIn.time).toLocaleTimeString()}
                            {record.checkIn.location && (
                              <div className="text-xs text-gray-500">{record.checkIn.location}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not checked in</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {record.checkOut?.time ? (
                          <div className="text-sm">
                            {new Date(record.checkOut.time).toLocaleTimeString()}
                            {record.checkOut.location && (
                              <div className="text-xs text-gray-500">{record.checkOut.location}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not checked out</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {record.totalWorkingHours ? (
                          <span className="text-sm">{record.totalWorkingHours.toFixed(2)} hrs</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {record.overtimeHours ? (
                          <span className="text-sm text-orange-600">{record.overtimeHours.toFixed(2)} hrs</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div className="flex gap-2">
                          {!record.checkIn?.time && (
                            <Can I="update" a="Attendance">
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(record.employeeId)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Check In
                              </Button>
                            </Can>
                          )}
                          {record.checkIn?.time && !record.checkOut?.time && (
                            <Can I="update" a="Attendance">
                              <Button
                                size="sm"
                                onClick={() => handleCheckOut(record.employeeId)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Check Out
                              </Button>
                            </Can>
                          )}
                          {record.checkIn?.time && !record.checkOut?.time && (
                            <Can I="update" a="Attendance">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBreak(record.employeeId, 'lunch')}
                              >
                                Break
                              </Button>
                            </Can>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Can I="read" a="Attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Export to Excel
              </Button>
              <Button variant="outline" className="w-full">
                Export to PDF
              </Button>
              <Button variant="outline" className="w-full">
                Attendance Summary
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Overtime Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Overtime Report
              </Button>
            </CardContent>
          </Card>
        </Can>

        <Can I="read" a="Attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leave Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Leaves
              </Button>
            </CardContent>
          </Card>
        </Can>
      </div>
    </div>
  );
};

export default AttendancePage;
