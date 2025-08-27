import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout so UI doesn't hang forever
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
