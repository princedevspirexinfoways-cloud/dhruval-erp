import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import { IUser } from '../types/models';

// Helper function to get user's primary role and company access
const getUserAccess = (user: IUser) => {
  if (user.isSuperAdmin) {
    return { role: 'super_admin', companyId: null, hasFullAccess: true };
  }
  
  const primaryAccess = user.companyAccess?.find(access => access.isActive);
  if (!primaryAccess) {
    return { role: 'user', companyId: null, hasFullAccess: false };
  }
  
  return {
    role: primaryAccess.role,
    companyId: primaryAccess.companyId,
    hasFullAccess: primaryAccess.role === 'owner' || primaryAccess.role === 'manager' || primaryAccess.role === 'super_admin'
  };
};

class AttendanceController {
  // Get all attendance - Admin & HR only
  static async getAllAttendance(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { companyId, date, employeeId } = req.query;
      
      let query: any = {};
      const userAccess = getUserAccess(user);
      
      // If user is not admin, restrict to their company
      if (userAccess.role !== 'admin' && userAccess.role !== 'super_admin' && userAccess.role !== 'owner') {
        query.companyId = userAccess.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      if (date) {
        query.date = new Date(date as string);
      }
      
      if (employeeId) {
        query.employeeId = employeeId;
      }
      
      const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department')
        .populate('companyId', 'name')
        .sort({ date: -1, 'checkIn.time': -1 });
      
      res.json({
        success: true,
        data: attendance,
        total: attendance.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching attendance data',
        error: error.message
      });
    }
  }

  // Get attendance by employee - Admin, HR, Manager
  static async getAttendanceByEmployee(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      
      let query: any = { employeeId };
      const userAccess = getUserAccess(user);
      
      // If user is not admin, restrict to their company
      if (!userAccess.hasFullAccess) {
        query.companyId = userAccess.companyId;
      }
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department')
        .populate('companyId', 'name')
        .sort({ date: -1 });
      
      res.json({
        success: true,
        data: attendance,
        total: attendance.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching employee attendance',
        error: error.message
      });
    }
  }

  // Get attendance by date - Admin, HR, Manager
  static async getAttendanceByDate(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { date } = req.params;
      const { companyId } = req.query;
      
      let query: any = { date: new Date(date) };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department')
        .populate('companyId', 'name')
        .sort({ 'checkIn.time': 1 });
      
      res.json({
        success: true,
        data: attendance,
        total: attendance.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching attendance by date',
        error: error.message
      });
    }
  }

  // Get attendance by date range - Admin, HR, Manager
  static async getAttendanceByDateRange(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate, companyId, employeeId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      let query: any = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      if (employeeId) {
        query.employeeId = employeeId;
      }
      
      const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department')
        .populate('companyId', 'name')
        .sort({ date: -1, 'checkIn.time': -1 });
      
      res.json({
        success: true,
        data: attendance,
        total: attendance.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching attendance by date range',
        error: error.message
      });
    }
  }

  // Check in - Admin, HR, Manager, Employee
  static async checkIn(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { employeeId, location, method } = req.body;
      
      // Check if user is checking in for themselves or has permission
      if (user.role === 'employee' && user.employeeId?.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'You can only check in for yourself'
        });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if attendance record already exists for today
      let attendance = await Attendance.findOne({
        employeeId,
        date: today
      });
      
      if (attendance && attendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: 'Already checked in today'
        });
      }
      
      if (!attendance) {
        // Create new attendance record
        attendance = new Attendance({
          employeeId,
          companyId: user.companyId,
          date: today,
          shiftType: 'day', // Default, can be updated
          checkIn: {
            time: new Date(),
            location: location || 'Main Gate',
            method: method || 'manual',
            verified: true
          },
          status: 'present',
          createdBy: user._id,
          updatedBy: user._id
        });
      } else {
        // Update existing record
        attendance.checkIn = {
          time: new Date(),
          location: location || 'Main Gate',
          method: method || 'manual',
          verified: true
        };
        attendance.status = 'present';
        attendance.updatedBy = user._id;
        attendance.updatedAt = new Date();
      }
      
      await attendance.save();
      
      res.json({
        success: true,
        message: 'Check-in successful',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during check-in',
        error: error.message
      });
    }
  }

  // Check out - Admin, HR, Manager, Employee
  static async checkOut(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { employeeId, location, method } = req.body;
      
      // Check if user is checking out for themselves or themselves
      if (user.role === 'employee' && user.employeeId?.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'You can only check out for yourself'
        });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        employeeId,
        date: today
      });
      
      if (!attendance || !attendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: 'No check-in record found for today'
        });
      }
      
      if (attendance.checkOut.time) {
        return res.status(400).json({
          success: false,
          message: 'Already checked out today'
        });
      }
      
      const checkOutTime = new Date();
      const checkInTime = attendance.checkIn.time;
      
      // Calculate working hours
      const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate overtime (assuming 8 hours is standard)
      const standardHours = 8;
      const overtimeHours = Math.max(0, workingHours - standardHours);
      
      attendance.checkOut = {
        time: checkOutTime,
        location: location || 'Main Gate',
        method: method || 'manual',
        verified: true
      };
      
      attendance.totalWorkingHours = Math.round(workingHours * 100) / 100;
      attendance.overtimeHours = Math.round(overtimeHours * 100) / 100;
      attendance.updatedBy = user._id;
      attendance.updatedAt = new Date();
      
      await attendance.save();
      
      res.json({
        success: true,
        message: 'Check-out successful',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during check-out',
        error: error.message
      });
    }
  }

  // Record break - Admin, HR, Manager, Employee
  static async recordBreak(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { employeeId, breakType, startTime, endTime } = req.body;
      
      // Check if user is recording break for themselves or has permission
      if (user.role === 'employee' && user.employeeId?.toString() !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'You can only record break for yourself'
        });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        employeeId,
        date: today
      });
      
      if (!attendance) {
        return res.status(400).json({
          success: false,
          message: 'No attendance record found for today'
        });
      }
      
      const breakStart = new Date(startTime);
      const breakEnd = new Date(endTime);
      const breakDuration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60); // in minutes
      
      const breakRecord = {
        startTime: breakStart,
        endTime: breakEnd,
        duration: breakDuration,
        type: breakType || 'other'
      };
      
      attendance.breakTime.push(breakRecord);
      attendance.updatedBy = user._id;
      attendance.updatedAt = new Date();
      
      await attendance.save();
      
      res.json({
        success: true,
        message: 'Break recorded successfully',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error recording break',
        error: error.message
      });
    }
  }

  // Update attendance - Admin & HR only
  static async updateAttendance(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { id } = req.params;
      const updateData = req.body;
      
      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }
      
      // Check if user has access to this attendance record
      if (user.role !== 'admin' && attendance.companyId.toString() !== user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      updateData.updatedBy = user._id;
      updateData.updatedAt = new Date();
      
      const updatedAttendance = await Attendance.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: updatedAttendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating attendance',
        error: error.message
      });
    }
  }

  // Bulk attendance entry - Admin & HR only
  static async bulkAttendanceEntry(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { attendanceData } = req.body;
      
      if (!Array.isArray(attendanceData)) {
        return res.status(400).json({
          success: false,
          message: 'Attendance data must be an array'
        });
      }
      
      const results = [];
      
      for (const record of attendanceData) {
        try {
          const attendance = new Attendance({
            ...record,
            companyId: user.companyId,
            createdBy: user._id,
            updatedBy: user._id
          });
          
          await attendance.save();
          results.push({ success: true, data: attendance });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Bulk attendance entry completed',
        results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error during bulk attendance entry',
        error: error.message
      });
    }
  }

  // Get attendance summary - Admin, HR, Manager
  static async getAttendanceSummary(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate, companyId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      let query: any = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department');
      
      // Calculate summary
      const summary = {
        totalRecords: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        halfDay: attendance.filter(a => a.status === 'half-day').length,
        leave: attendance.filter(a => a.status === 'leave').length,
        totalWorkingHours: attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0),
        totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching attendance summary',
        error: error.message
      });
    }
  }

  // Get overtime report - Admin, HR, Manager
  static async getOvertimeReport(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate, companyId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }
      
      let query: any = {
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        },
        overtimeHours: { $gt: 0 }
      };
      
      // If user is not admin, restrict to their company
      if (user.role !== 'admin') {
        query.companyId = user.companyId;
      } else if (companyId) {
        query.companyId = companyId;
      }
      
      const overtimeRecords = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department')
        .sort({ overtimeHours: -1 });
      
      const totalOvertime = overtimeRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
      
      res.json({
        success: true,
        data: {
          records: overtimeRecords,
          totalOvertime,
          totalRecords: overtimeRecords.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching overtime report',
        error: error.message
      });
    }
  }

  // Get my attendance - Employee self-service
  static async getMyAttendance(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { startDate, endDate } = req.query;
      
      if (!user.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID not found'
        });
      }
      
      let query: any = { employeeId: user.employeeId };
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      
      const attendance = await Attendance.find(query)
        .populate('companyId', 'name')
        .sort({ date: -1 });
      
      res.json({
        success: true,
        data: attendance,
        total: attendance.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching your attendance',
        error: error.message
      });
    }
  }
}

export default AttendanceController;
