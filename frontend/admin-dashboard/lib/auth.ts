import { LoginResponse } from './types';

const TOKEN_KEY = 'cw_token';
const TENANT_KEY = 'cw_tenant';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error ?? 'Login failed');
  }

  const data: LoginResponse = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(TENANT_KEY, JSON.stringify({ id: data.tenantId, name: data.tenantName }));

  // Also set cookie for Next.js middleware
  document.cookie = `${TOKEN_KEY}=${data.token}; path=/; max-age=${8 * 3600}; SameSite=Lax`;

  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getTenantInfo(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TENANT_KEY);
  return raw ? JSON.parse(raw) : null;
}
