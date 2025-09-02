import { Request, Response } from 'express';
import { prisma, computeEndsAt } from '../utils/prisma';
import { z } from 'zod';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    usertype: string;
  };
}

// Validation schema for creating appointments
const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  startsAt: z.string().datetime(),
  reason: z.string().optional(),
});

export async function createAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const { doctorId, departmentId, startsAt, reason } = createAppointmentSchema.parse(req.body);
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify the doctor exists and is active
    const doctor = await prisma.doctors.findFirst({
      where: {
        id: doctorId,
        isActive: true,
        departmentId: departmentId,
      },
      include: {
        user: true,
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or not available in this department' });
    }

    // Check if the time slot is available
    const startTime = new Date(startsAt);
    const endTime = computeEndsAt(startTime);

    const existingAppointment = await prisma.appointments.findFirst({
      where: {
        doctorId: doctorId,
        startsAt: startTime,
      },
    });

    if (existingAppointment) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    // Create the appointment
    const appointment = await prisma.appointments.create({
      data: {
        doctorId: doctorId,
        patientId: patientId,
        departmentId: departmentId,
        startsAt: startTime,
        endsAt: endTime,
        status: 'PENDING',
        reason: reason || 'General consultation',
        source: 'MOBILE',
      },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
        department: true,
        patient: true,
      },
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: appointment.id,
        doctor: {
          id: appointment.doctor.id,
          name: appointment.doctor.user.name,
          title: appointment.doctor.title,
        },
        department: {
          id: appointment.department?.id,
          name: appointment.department?.name,
        },
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        reason: appointment.reason,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.issues });
    }

    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAppointments(req: AuthenticatedRequest, res: Response) {
  try {
    const patientId = req.user?.id;

    if (!patientId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const appointments = await prisma.appointments.findMany({
      where: {
        patientId: patientId,
      },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
        department: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    res.json({
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        doctor: {
          id: appointment.doctor.id,
          name: appointment.doctor.user.name,
          title: appointment.doctor.title,
        },
        department: {
          id: appointment.department?.id,
          name: appointment.department?.name,
        },
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        reason: appointment.reason,
      })),
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.departments.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDoctorsByDepartment(req: Request, res: Response) {
  try {
    const { departmentId } = req.params;
    const departmentIdNum = parseInt(departmentId);

    if (isNaN(departmentIdNum)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const doctors = await prisma.doctors.findMany({
      where: {
        departmentId: departmentIdNum,
        isActive: true,
      },
      include: {
        user: true,
        department: true,
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    res.json({
      doctors: doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.user.name,
        title: doctor.title,
        departmentId: doctor.departmentId,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
