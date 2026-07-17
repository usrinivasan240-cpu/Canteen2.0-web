import { API_BASE } from './config';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export const api = {
  auth: {
    login: (email: string, password: string, role: string) =>
      post<{ success: boolean; user: { id: string; name: string; email: string; role: string; collegeId?: string; canteenId?: string; subCanteenId?: string } }>('/api/auth/login', { email, password, role }),
  },

  colleges: {
    list: () => get<unknown[]>('/api/colleges'),
    create: (data: { name: string; location: string; status: string }) =>
      post<unknown>('/api/colleges', data),
    remove: (id: string) => del<unknown>(`/api/colleges/${id}`),
  },

  canteens: {
    list: () => get<unknown[]>('/api/canteens'),
    create: (data: { name: string; collegeId: string; ownerName: string; ownerEmail: string; location: string }) =>
      post<unknown>('/api/canteens', data),
    remove: (id: string) => del<unknown>(`/api/canteens/${id}`),
    updateName: (canteenId: string, name: string) =>
      post<unknown>('/api/canteen/update-name', { canteenId, name }),
  },

  subcanteens: {
    list: () => get<unknown[]>('/api/subcanteens'),
    create: (data: { name: string; canteenId: string; status: string }) =>
      post<unknown>('/api/subcanteens', data),
    remove: (id: string) => del<unknown>(`/api/subcanteens/${id}`),
  },

  users: {
    list: () => get<unknown[]>('/api/users'),
    create: (data: { name: string; email: string; role: string; collegeId?: string; canteenId?: string; subCanteenId?: string; posting?: string }) =>
      post<unknown>('/api/users', data),
    remove: (email: string) => del<unknown>(`/api/users/${encodeURIComponent(email)}`),
    updateRole: (email: string, role: string, posting?: string) =>
      put<unknown>(`/api/users/${encodeURIComponent(email)}/role`, { role, posting }),
  },

  canteenData: {
    get: (canteenId: string) =>
      get<{ menu: unknown[]; orders: unknown[]; reviews: unknown[]; settings: unknown }>(
        `/api/canteen?canteenId=${encodeURIComponent(canteenId)}`
      ),
  },
};
