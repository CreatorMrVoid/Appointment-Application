import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { createAppointment, getAppointments, getDepartments, getDoctorsByDepartment, getDoctorSchedule, updateAppointmentStatus } from '../controllers/appointment_controller';

const router = Router();

// Public endpoints for metadata
router.get('/departments', getDepartments);
router.get('/doctors/:departmentId', getDoctorsByDepartment);

// Require auth for the rest
router.use(requireAuth);

// Create a new appointment
router.post('/', createAppointment);

// Get user's appointments
router.get('/', getAppointments);

// Get logged-in doctor's schedule
router.get('/schedule', getDoctorSchedule);

// Update appointment status (doctor-owned)
router.patch('/:id/status', updateAppointmentStatus);

export default router;
