export type Role = "OWNER" | "OPERATOR";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type SmartPlugDevice = {
  id: string;
  deviceId: string;
  clientId: string;
  clientSecret: string;
  isActive: boolean;
  playStationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UnitStatus = "IDLE";

export type PlayStationUnit = {
  id: string;
  name: string;
  status: UnitStatus;
  pricePerHour: string | number;
  smartPlugDevice?: SmartPlugDevice | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  price: string | number;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PackageFnbItem = {
  id: string;
  packageId: string;
  menuItemId: string;
  quantity: number;
  menuItem: MenuItem;
};

export type PackageItem = {
  id: string;
  name: string;
  flatPrice: string | number;
  unitId: string;
  durationMinute: number;
  unit: PlayStationUnit;
  packageFnbItems: PackageFnbItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type RentalStatus = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

export type BillingTimer = {
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  expectedEndTime: string | null;
  remainingMinutes: number | null;
  remainingSeconds: number | null;
  isExpired: boolean;
  status: RentalStatus;
};

export type BillingSession = {
  id: string;
  playStationId: string;
  packageId: string | null;
  status: RentalStatus;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  expectedEndTime: string | null;
  extendedMinutes: number;
  totalAmount: string | number;
  createdAt?: string;
  updatedAt?: string;
  playStation: PlayStationUnit;
  package: PackageItem | null;
  timer?: BillingTimer;
};

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "CANCELLED";

export type OrderLog = {
  id: string;
  rentalSessionId: string | null;
  menuItemId: string;
  quantity: number;
  totalPrice: string | number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  menuItem: MenuItem;
  rentalSession: BillingSession | null;
};
