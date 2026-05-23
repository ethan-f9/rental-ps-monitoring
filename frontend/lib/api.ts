import { clearStoredSession, getStoredToken } from "@/lib/auth";
import type {
  AuthSession,
  AuthUser,
  BillingSession,
  MenuItem,
  OrderLog,
  OrderStatus,
  PackageItem,
  PlayStationUnit,
  SmartPlugDevice
} from "@/types/api";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const token = getStoredToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearStoredSession();
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(data?.message ?? "Request failed", response.status);
  }

  return data as T;
};

export const api = {
  login: (email: string, password: string) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true
    }),
  getActiveSessions: () => request<BillingSession[]>("/billing/active"),
  startSession: (payload: { packageId: string } | { unitId: string; durationMinute: number }) =>
    request<BillingSession>("/billing/start", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  stopSession: (sessionId: string) =>
    request<BillingSession>(`/billing/stop/${sessionId}`, {
      method: "POST"
    }),
  extendSession: (sessionId: string, extraMinutes: number) =>
    request<BillingSession>(`/billing/extend/${sessionId}`, {
      method: "POST",
      body: JSON.stringify({ extraMinutes })
    }),
  getBillingLogs: () => request<BillingSession[]>("/billing/logs"),
  deleteBillingLog: (id: string) =>
    request<void>(`/billing/logs/${id}`, {
      method: "DELETE"
    }),
  createOrder: (sessionId: string | null | undefined, menuItemId: string, quantity: number) =>
    request<OrderLog>("/orders", {
      method: "POST",
      body: JSON.stringify({ ...(sessionId ? { sessionId } : {}), menuItemId, quantity })
    }),
  updateOrderStatus: (id: string, status: Extract<OrderStatus, "SERVED" | "CANCELLED">) =>
    request<OrderLog>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    }),
  getOrderLogs: (type?: "fnb" | "session") =>
    request<OrderLog[]>(type ? `/orders/logs?type=${type}` : "/orders/logs"),
  deleteOrderLog: (id: string) =>
    request<void>(`/orders/logs/${id}`, {
      method: "DELETE"
    }),
  getPackages: () => request<PackageItem[]>("/packages"),
  createPackage: (payload: {
    name: string;
    flatPrice: number;
    unitId: string;
    durationMinute: number;
    fnbItems: Array<{ menuItemId: string; quantity: number }>;
  }) =>
    request<PackageItem>("/packages", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updatePackage: (
    id: string,
    payload: {
      name: string;
      flatPrice: number;
      unitId: string;
      durationMinute: number;
      fnbItems: Array<{ menuItemId: string; quantity: number }>;
    }
  ) =>
    request<PackageItem>(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deletePackage: (id: string) =>
    request<void>(`/packages/${id}`, {
      method: "DELETE"
    }),
  getUnits: () => request<PlayStationUnit[]>("/units"),
  createUnit: (payload: { name: string; pricePerHour: number }) =>
    request<PlayStationUnit>("/units", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateUnit: (id: string, payload: { name: string; pricePerHour: number }) =>
    request<PlayStationUnit>(`/units/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteUnit: (id: string) =>
    request<void>(`/units/${id}`, {
      method: "DELETE"
    }),
  getUnitSmartPlug: (unitId: string) => request<SmartPlugDevice | null>(`/units/${unitId}/smart-plug`),
  saveUnitSmartPlug: (unitId: string, payload: { deviceId: string; clientId: string; clientSecret: string }) =>
    request<SmartPlugDevice>(`/units/${unitId}/smart-plug`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteUnitSmartPlug: (unitId: string) =>
    request<void>(`/units/${unitId}/smart-plug`, {
      method: "DELETE"
    }),
  getMenuItems: () => request<MenuItem[]>("/menu"),
  createMenuItem: (payload: { name: string; price: number; category: string }) =>
    request<MenuItem>("/menu", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateMenuItem: (id: string, payload: { name: string; price: number; category: string }) =>
    request<MenuItem>(`/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteMenuItem: (id: string) =>
    request<void>(`/menu/${id}`, {
      method: "DELETE"
    }),
  getUsers: () => request<AuthUser[]>("/users"),
  createUser: (payload: { name: string; email: string; password: string; role: "OPERATOR" }) =>
    request<{ user: AuthUser }>("/users", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateUser: (id: string, payload: { name?: string; email?: string; password?: string }) =>
    request<{ user: AuthUser }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, {
      method: "DELETE"
    })
};
