import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import ManpowerController from '../../controllers/ManpowerController';
import AttendanceController from '../../controllers/AttendanceController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Manpower Management Routes - Admin & HR only
router.get('/', requireRole(['admin', 'hr']), ManpowerController.getAllManpower);
router.get('/:id', requireRole(['admin', 'hr']), ManpowerController.getManpowerById);
router.post('/', requireRole(['admin', 'hr']), ManpowerController.createManpower);
router.put('/:id', requireRole(['admin', 'hr']), ManpowerController.updateManpower);
router.delete('/:id', requireRole(['admin']), ManpowerController.deleteManpower);

// Company and Department based access - Managers can view their department
router.get('/company/:companyId', requireRole(['admin', 'hr', 'manager']), ManpowerController.getManpowerByCompany);
router.get('/department/:department', requireRole(['admin', 'hr', 'manager']), ManpowerController.getManpowerByDepartment);
router.get('/status/:status', requireRole(['admin', 'hr', 'manager']), ManpowerController.getManpowerByStatus);

// Attendance Management Routes - Different access levels
router.get('/attendance/all', requireRole(['admin', 'hr']), AttendanceController.getAllAttendance);
router.get('/attendance/employee/:employeeId', requireRole(['admin', 'hr', 'manager']), AttendanceController.getAttendanceByEmployee);
router.get('/attendance/date/:date', requireRole(['admin', 'hr', 'manager']), AttendanceController.getAttendanceByDate);
router.get('/attendance/range', requireRole(['admin', 'hr', 'manager']), AttendanceController.getAttendanceByDateRange);

// Attendance Entry - Managers and Employees can mark their own attendance
router.post('/attendance/checkin', requireRole(['admin', 'hr', 'manager', 'employee']), AttendanceController.checkIn);
router.post('/attendance/checkout', requireRole(['admin', 'hr', 'manager', 'employee']), AttendanceController.checkOut);
router.post('/attendance/break', requireRole(['admin', 'hr', 'manager', 'employee']), AttendanceController.recordBreak);

// Attendance Management - Only HR can modify
router.put('/attendance/:id', requireRole(['admin', 'hr']), AttendanceController.updateAttendance);
router.post('/attendance/bulk', requireRole(['admin', 'hr']), AttendanceController.bulkAttendanceEntry);

// Reports - Different access levels
router.get('/attendance/reports/summary', requireRole(['admin', 'hr', 'manager']), AttendanceController.getAttendanceSummary);
router.get('/attendance/reports/overtime', requireRole(['admin', 'hr', 'manager']), AttendanceController.getOvertimeReport);

// Employee Self-Service Routes - Employees can view their own data
router.get('/profile/me', requireRole(['admin', 'hr', 'manager', 'employee']), ManpowerController.getMyProfile);
router.put('/profile/me', requireRole(['admin', 'hr', 'manager', 'employee']), ManpowerController.updateMyProfile);
router.get('/attendance/me', requireRole(['admin', 'hr', 'employee']), AttendanceController.getMyAttendance);

export default router;
