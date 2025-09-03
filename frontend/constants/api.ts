import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout so UI doesn't hang forever
});

export function setAccessToken(token?: string) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Normalize common network errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }
    return Promise.reject(error);
  }
);

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  ssn?: string;
  usertype?: 'patient' | 'doctor' | string;
};

export async function registerUser(req: RegisterRequest) {
  const res = await api.post('/api/auth/register', req);
  return res.data as { user: { id: number; name: string; email: string; usertype: string; created_at: string } };
}

export async function loginUser(req: { email: string; password: string }) {
  const res = await api.post('/api/auth/login', req);
  return res.data as { user: any; tokens: { accessToken: string; refreshToken: string } };
}

// Appointment API functions
export type CreateAppointmentRequest = {
  doctorId: number;
  departmentId: number;
  startsAt: string;
  reason?: string;
};

export type Appointment = {
  id: number;
  doctor: {
    id: number;
    name: string;
    title?: string;
  };
  department: {
    id: number;
    name: string;
  };
  startsAt: string;
  endsAt: string;
  status: string;
  reason?: string;
};

export type Department = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  phone?: string;
  location?: string;
};

export type Doctor = {
  id: number;
  name: string;
  title?: string;
  departmentId: number;
};

export async function createAppointment(req: CreateAppointmentRequest) {
  const res = await api.post('/api/appointments', req);
  return res.data as { message: string; appointment: Appointment };
}

export async function getAppointments() {
  const res = await api.get('/api/appointments');
  return res.data as { appointments: Appointment[] };
}

export async function getDepartments() {
  const res = await api.get('/api/appointments/departments');
  return res.data as { departments: Department[] };
}

export async function getDoctorsByDepartment(departmentId: number) {
  const res = await api.get(`/api/appointments/doctors/${departmentId}`);
  return res.data as { doctors: Doctor[] };
}

export type DoctorScheduleItem = {
  id: number;
  patient: { id: number; name: string };
  department: { id: number | null; name: string | null };
  startsAt: string;
  endsAt: string;
  status: string;
  reason?: string | null;
};

export async function getDoctorSchedule() {
  const res = await api.get('/api/appointments/schedule');
  return res.data as { schedule: DoctorScheduleItem[] };
}