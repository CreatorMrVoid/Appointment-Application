import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { createAppointment, getAppointments, getDepartments, getDoctorsByDepartment, getDoctorSchedule } from '../controllers/appointment_controller';

const router = Router();

// All appointment routes require authentication
router.use(requireAuth);

// Create a new appointment
router.post('/', createAppointment);

// Get user's appointments
router.get('/', getAppointments);

// Get all departments
router.get('/departments', getDepartments);

// Get doctors by department
router.get('/doctors/:departmentId', getDoctorsByDepartment);

// Get logged-in doctor's schedule
router.get('/schedule', getDoctorSchedule);

export default router;
