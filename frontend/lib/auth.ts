import type {
  AuthSession,
  AuthUser,
  Role
} from "@/types/api";

const AUTH_STORAGE_KEY = "ps-rental-auth";

const isBrowser = () => typeof window !== "undefined";

export const getStoredSession = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredSession = (session: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getStoredToken = () => getStoredSession()?.token ?? null;

export const getStoredUser = (): AuthUser | null => getStoredSession()?.user ?? null;

export const hasRequiredRole = (user: AuthUser | null, requiredRole?: Role) => {
  if (!requiredRole) {
    return Boolean(user);
  }

  return user?.role === requiredRole;
};
