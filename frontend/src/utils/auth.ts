// src/utils/auth.ts
// Centralised auth helpers — token storage, user parsing, and logout.

export const TOKEN_KEY = 'academic_review_token';
export const AUTH_KEY = 'aurelia_auth';
export const USER_KEY = 'aurelia_user';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
  department: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Check JWT expiration without a full decode library (safe — we just inspect exp claim)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getUserRole(): string | null {
  const user = getAuthUser();
  return user?.role?.toUpperCase() ?? null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear any legacy key that may have been stored
  localStorage.removeItem('aurelia_token');
}
