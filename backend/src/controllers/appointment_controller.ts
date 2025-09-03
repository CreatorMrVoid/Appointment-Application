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
    const patientId = (req.user as any)?.sub;
    
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
      select: {
        id: true,
        userId: true,
        title: true,
        departmentId: true,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        doctorId: true,
        departmentId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
      },
    });

    // Resolve doctor and department display fields
    const createdDoctor = await prisma.doctors.findFirst({
      where: { id: appointment.doctorId },
      select: { userId: true, title: true },
    });
    const doctorUser = createdDoctor
      ? await prisma.users.findFirst({ where: { id: createdDoctor.userId }, select: { name: true } })
      : null;
    const dep = appointment.departmentId
      ? await prisma.departments.findFirst({ where: { id: appointment.departmentId }, select: { id: true, name: true } })
      : null;

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: appointment.id,
        doctor: {
          id: appointment.doctorId,
          name: doctorUser?.name || 'Unknown',
          title: createdDoctor?.title || null,
        },
        department: dep
          ? {
              id: dep.id,
              name: dep.name,
            }
          : { id: null, name: null },
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
    const patientId = (req.user as any)?.sub;

    if (!patientId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const appointments = await prisma.appointments.findMany({
      where: {
        patientId: patientId,
      },
      select: {
        id: true,
        doctorId: true,
        departmentId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    const doctorIds = Array.from(new Set(appointments.map((a) => a.doctorId)));
    const doctors = doctorIds.length
      ? await prisma.doctors.findMany({
          where: { id: { in: doctorIds } },
          select: { id: true, userId: true, title: true },
        })
      : [];
    const doctorIdToDoctor = new Map(doctors.map((d) => [d.id, d] as const));
    const userIds = Array.from(new Set(doctors.map((d) => d.userId)));
    const users = userIds.length
      ? await prisma.users.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userIdToName = new Map(users.map((u) => [u.id, u.name] as const));
    const departmentIds = Array.from(new Set(appointments.map((a) => a.departmentId).filter(Boolean))) as number[];
    const departments = departmentIds.length
      ? await prisma.departments.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
      : [];
    const depIdToDep = new Map(departments.map((d) => [d.id, d] as const));

    res.json({
      appointments: appointments.map((appointment) => {
        const doc = doctorIdToDoctor.get(appointment.doctorId);
        const doctorName = doc ? userIdToName.get(doc.userId) || 'Unknown' : 'Unknown';
        const dep = appointment.departmentId ? depIdToDep.get(appointment.departmentId) : undefined;
        return {
          id: appointment.id,
          doctor: {
            id: appointment.doctorId,
            name: doctorName,
            title: doc?.title || null,
          },
          department: dep ? { id: dep.id, name: dep.name } : { id: null, name: null },
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
          reason: appointment.reason,
        };
      }),
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

    // Fetch doctors for department
    const doctors = await prisma.doctors.findMany({
      where: {
        departmentId: departmentIdNum,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        departmentId: true,
      },
    });

    // Fetch corresponding users to resolve doctor names
    const userIds = doctors.map((d) => d.userId);
    const users = userIds.length
      ? await prisma.users.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userIdToName = new Map(users.map((u) => [u.id, u.name] as const));

    // Sort by user name asc to preserve previous behavior
    const doctorsWithNames = doctors
      .map((d) => ({
        id: d.id,
        name: userIdToName.get(d.userId) || 'Unknown',
        title: d.title || null,
        departmentId: d.departmentId || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ doctors: doctorsWithNames });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get schedule for the logged-in doctor
export async function getDoctorSchedule(req: Request, res: Response) {
  try {
    const user = (req as any).user as { sub?: number } | undefined;
    if (!user?.sub) return res.status(401).json({ error: 'User not authenticated' });

    // Find doctor profile by userId
    const doctor = await prisma.doctors.findFirst({
      where: { userId: user.sub, isActive: true },
      select: { id: true },
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });

    // Fetch appointments for this doctor
    const appointments = await prisma.appointments.findMany({
      where: { doctorId: doctor.id },
      select: {
        id: true,
        patientId: true,
        departmentId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        reason: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    // Resolve patient names
    const patientIds = Array.from(new Set(appointments.map(a => a.patientId)));
    const patients = patientIds.length
      ? await prisma.users.findMany({ where: { id: { in: patientIds } }, select: { id: true, name: true } })
      : [];
    const patientIdToName = new Map(patients.map(p => [p.id, p.name] as const));

    // Resolve departments
    const depIds = Array.from(new Set(appointments.map(a => a.departmentId).filter(Boolean))) as number[];
    const departments = depIds.length
      ? await prisma.departments.findMany({ where: { id: { in: depIds } }, select: { id: true, name: true } })
      : [];
    const depIdToDep = new Map(departments.map(d => [d.id, d] as const));

    return res.json({
      schedule: appointments.map(a => ({
        id: a.id,
        patient: { id: a.patientId, name: patientIdToName.get(a.patientId) || 'Unknown' },
        department: a.departmentId ? depIdToDep.get(a.departmentId) || { id: a.departmentId, name: 'Department' } : { id: null, name: null },
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        reason: a.reason,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
