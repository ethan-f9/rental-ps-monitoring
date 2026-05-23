import { Prisma, RentalStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { tuyaService } from "../smart-plug/smart-plug.service";

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "BillingError";
  }
}

const ACTIVE_SESSION_STATUSES: RentalStatus[] = [RentalStatus.RUNNING, RentalStatus.PAUSED];

const includeOptions = {
  playStation: {
    include: {
      smartPlugDevice: true
    }
  },
  package: {
    include: {
      unit: true,
      packageFnbItems: {
        include: {
          menuItem: true
        }
      }
    }
  }
} as const;

const toTimerInfo = (session: {
  expectedEndTime: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  status: RentalStatus;
}) => {
  const now = Date.now();
  const expectedEndTime = session.expectedEndTime?.getTime() ?? null;
  const remainingMs = expectedEndTime ? Math.max(expectedEndTime - now, 0) : null;

  return {
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    expectedEndTime: session.expectedEndTime,
    remainingMinutes: remainingMs === null ? null : Math.floor(remainingMs / 60000),
    remainingSeconds: remainingMs === null ? null : Math.floor((remainingMs % 60000) / 1000),
    isExpired: expectedEndTime === null ? false : expectedEndTime <= now,
    status: session.status
  };
};

const toggleSmartPlug = async (
  smartPlugDevice:
    | {
        deviceId: string;
        clientId: string;
        clientSecret: string;
        isActive: boolean;
      }
    | null
    | undefined,
  action: "on" | "off"
) => {
  if (!smartPlugDevice || !smartPlugDevice.isActive) {
    return;
  }

  try {
    if (action === "on") {
      await tuyaService.turnOn(smartPlugDevice.deviceId, smartPlugDevice.clientId, smartPlugDevice.clientSecret);
      return;
    }

    await tuyaService.turnOff(smartPlugDevice.deviceId, smartPlugDevice.clientId, smartPlugDevice.clientSecret);
  } catch (error) {
    console.error(`Failed to turn ${action} smart plug`, error);
  }
};

export const completeExpiredSessions = async () => {
  const now = new Date();
  const expiredSessions = await prisma.rentalSession.findMany({
    where: {
      status: RentalStatus.RUNNING,
      expectedEndTime: {
        lte: now
      }
    },
    include: includeOptions
  });

  for (const session of expiredSessions) {
    const completedSession = await prisma.rentalSession.update({
      where: { id: session.id },
      data: {
        status: RentalStatus.COMPLETED,
        endTime: now
      },
      include: includeOptions
    });

    await toggleSmartPlug(completedSession.playStation.smartPlugDevice, "off");
  }
};

const toDecimalAmount = (value: number) => new Prisma.Decimal(value.toFixed(2));

type StartSessionInput =
  | { packageId: string }
  | { unitId: string; durationMinute: number };

const ensureNoActiveSession = async (unitId: string) => {
  const existingSession = await prisma.rentalSession.findFirst({
    where: {
      playStationId: unitId,
      status: {
        in: ACTIVE_SESSION_STATUSES
      }
    }
  });

  if (existingSession) {
    throw new BillingError("This PlayStation unit already has an active session", 400);
  }
};

export const billingService = {
  async startSession(input: StartSessionInput) {
    const startTime = new Date();

    if ("packageId" in input) {
      const rentalPackage = await prisma.package.findUnique({
        where: { id: input.packageId },
        include: {
          unit: {
            include: {
              smartPlugDevice: true
            }
          }
        }
      });

      if (!rentalPackage) {
        throw new BillingError("Package not found", 404);
      }

      await ensureNoActiveSession(rentalPackage.unitId);

      const expectedEndTime = new Date(startTime.getTime() + rentalPackage.durationMinute * 60000);
      const session = await prisma.rentalSession.create({
        data: {
          playStationId: rentalPackage.unitId,
          packageId: input.packageId,
          status: RentalStatus.RUNNING,
          startTime,
          duration: rentalPackage.durationMinute,
          expectedEndTime,
          totalAmount: rentalPackage.flatPrice
        },
        include: includeOptions
      });

      await toggleSmartPlug(rentalPackage.unit.smartPlugDevice, "on");
      return session;
    }

    const unit = await prisma.playStationUnit.findUnique({
      where: { id: input.unitId },
      include: {
        smartPlugDevice: true
      }
    });

    if (!unit) {
      throw new BillingError("PlayStation unit not found", 404);
    }

    await ensureNoActiveSession(unit.id);

    const expectedEndTime = new Date(startTime.getTime() + input.durationMinute * 60000);
    const totalAmount = toDecimalAmount(Number(unit.pricePerHour) * (input.durationMinute / 60));
    const session = await prisma.rentalSession.create({
      data: {
        playStationId: unit.id,
        packageId: null,
        status: RentalStatus.RUNNING,
        startTime,
        duration: input.durationMinute,
        expectedEndTime,
        totalAmount
      },
      include: includeOptions
    });

    await toggleSmartPlug(unit.smartPlugDevice, "on");
    return session;
  },

  async stopSession(sessionId: string) {
    const session = await prisma.rentalSession.findUnique({
      where: { id: sessionId },
      include: includeOptions
    });

    if (!session) {
      throw new BillingError("Rental session not found", 404);
    }

    if (session.status === RentalStatus.COMPLETED) {
      throw new BillingError("Rental session is already completed", 400);
    }

    const completedSession = await prisma.rentalSession.update({
      where: { id: sessionId },
      data: {
        status: RentalStatus.COMPLETED,
        endTime: new Date()
      },
      include: includeOptions
    });

    await toggleSmartPlug(completedSession.playStation.smartPlugDevice, "off");
    return completedSession;
  },

  async extendSession(sessionId: string, extraMinutes: number) {
    const session = await prisma.rentalSession.findUnique({
      where: { id: sessionId },
      include: {
        playStation: true
      }
    });

    if (!session) {
      throw new BillingError("Rental session not found", 404);
    }

    if (!(ACTIVE_SESSION_STATUSES as RentalStatus[]).includes(session.status)) {
      throw new BillingError("Only active sessions can be extended", 400);
    }

    const currentExpectedEnd = session.expectedEndTime ?? new Date();
    const extensionPrice = Number(session.playStation.pricePerHour) * (extraMinutes / 60);

    return prisma.rentalSession.update({
      where: { id: sessionId },
      data: {
        extendedMinutes: session.extendedMinutes + extraMinutes,
        duration: (session.duration ?? 0) + extraMinutes,
        expectedEndTime: new Date(currentExpectedEnd.getTime() + extraMinutes * 60000),
        totalAmount: session.totalAmount.add(toDecimalAmount(extensionPrice))
      },
      include: includeOptions
    });
  },

  async getActiveSessions() {
    await completeExpiredSessions();

    const sessions = await prisma.rentalSession.findMany({
      where: {
        status: {
          in: ACTIVE_SESSION_STATUSES
        }
      },
      include: includeOptions,
      orderBy: {
        startTime: "desc"
      }
    });

    return sessions.map((session) => ({
      ...session,
      timer: toTimerInfo(session)
    }));
  },

  async getSessionLogs() {
    await completeExpiredSessions();

    return prisma.rentalSession.findMany({
      include: includeOptions,
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
