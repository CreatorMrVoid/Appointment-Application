import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'
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

export async function saveAccessToken(token: string) {
  try {
    await AsyncStorage.setItem('access_token', token);
  } catch {}
  setAccessToken(token);
}

// Persist and retrieve current user (for HomeScreen greeting and role-aware views) - Added to display users name on home Screen
export async function saveCurrentUser(user: any) {
  try {
    await AsyncStorage.setItem('current_user', JSON.stringify(user || {}));
  } catch {}
}

export async function loadCurrentUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loadAccessToken() {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) setAccessToken(token);
  } catch {}
}

// Attach token on each request in case defaults aren't hydrated yet
api.interceptors.request.use(async (config) => {
  try {
    if (!config.headers) config.headers = {} as any;
    if (!('Authorization' in config.headers) || !config.headers.Authorization) {
      const token = await AsyncStorage.getItem('access_token');
      if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

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
  // Doctor-specific optional fields
  departmentId?: number;
  title?: string;
  bio?: string;
  room?: string;
  room_phone?: string;
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

// Always return a normalized shape: { appointments: Appointment[] }
export async function getAppointments(params?: { start?: string; end?: string }) {
  const res = await api.get('/api/appointments', { params });
  const data = res.data as { appointments?: Appointment[] } | Appointment[];
  const appointments = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments! : [];
  return { appointments } as { appointments: Appointment[] };
}

// Calendar range helper – returns same normalized shape
export async function getAppointmentDates(params: { start: string; end: string }) {
  const res = await api.get('/api/appointments', { params });
  const data = res.data as { appointments?: Appointment[] } | Appointment[];
  const appointments = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments! : [];
  return { appointments } as { appointments: Appointment[] };
}

export async function updateAppointmentStatus(
  id: number,
  next: 'upcoming' | 'cancelled',
  options?: { cancellationReason?: string }
) {
  const body: any = { status: next };
  if (next === 'cancelled' && options?.cancellationReason) {
    body.cancellationReason = options.cancellationReason;
  }
  const res = await api.patch(`/api/appointments/${id}/status`, body);
  return res.data as { ok: boolean; item: DoctorScheduleItem };
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

export async function getDepartments() {
  const res = await api.get('/api/appointments/departments');
  return res.data as { departments: Department[] };
}

export async function getDoctorsByDepartment(departmentId: number) {
  const res = await api.get(`/api/appointments/doctors/${departmentId}`);
  return res.data as { doctors: Doctor[] };
}

export async function getDoctorSchedule() {
  const res = await api.get('/api/appointments/schedule');
  return res.data as { schedule: DoctorScheduleItem[] };
}



