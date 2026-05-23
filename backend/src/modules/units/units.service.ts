import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

type SmartPlugInput = {
  deviceId: string;
  clientId: string;
  clientSecret: string;
};

const smartPlugSelect = {
  id: true,
  deviceId: true,
  clientId: true,
  clientSecret: true,
  isActive: true,
  playStationId: true,
  createdAt: true,
  updatedAt: true
} as const;

const maskSecret = (value: string) => {
  if (!value) {
    return "";
  }

  if (value.length <= 4) {
    return "*".repeat(value.length);
  }

  return `${"*".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
};

const toSmartPlugResponse = <T extends { clientSecret: string }>(smartPlug: T) => ({
  ...smartPlug,
  clientSecret: maskSecret(smartPlug.clientSecret)
});

export class UnitsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "UnitsError";
  }
}

const handlePrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new UnitsError("Unit name already exists", 400);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    throw new UnitsError("Unit cannot be deleted because it is still referenced", 400);
  }

  throw error;
};

const getUnitOrThrow = async (id: string) => {
  const unit = await prisma.playStationUnit.findUnique({
    where: { id }
  });

  if (!unit) {
    throw new UnitsError("Unit not found", 404);
  }

  return unit;
};

export const unitsService = {
  async listUnits() {
    return prisma.playStationUnit.findMany({
      include: {
        smartPlugDevice: {
          select: smartPlugSelect
        }
      },
      orderBy: {
        name: "asc"
      }
    });
  },

  async createUnit(name: string, pricePerHour: number) {
    try {
      return await prisma.playStationUnit.create({
        data: { name, pricePerHour },
        include: {
          smartPlugDevice: {
            select: smartPlugSelect
          }
        }
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateUnit(id: string, name: string, pricePerHour: number) {
    await getUnitOrThrow(id);

    try {
      return await prisma.playStationUnit.update({
        where: { id },
        data: { name, pricePerHour },
        include: {
          smartPlugDevice: {
            select: smartPlugSelect
          }
        }
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async getSmartPlug(unitId: string) {
    await getUnitOrThrow(unitId);

    const smartPlug = await prisma.smartPlugDevice.findUnique({
      where: { playStationId: unitId },
      select: smartPlugSelect
    });

    return smartPlug ? toSmartPlugResponse(smartPlug) : null;
  },

  async upsertSmartPlug(unitId: string, input: SmartPlugInput) {
    await getUnitOrThrow(unitId);

    try {
      const smartPlug = await prisma.smartPlugDevice.upsert({
        where: { playStationId: unitId },
        update: {
          deviceId: input.deviceId,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
          isActive: true
        },
        create: {
          playStationId: unitId,
          deviceId: input.deviceId,
          clientId: input.clientId,
          clientSecret: input.clientSecret,
          isActive: true
        },
        select: smartPlugSelect
      });

      return toSmartPlugResponse(smartPlug);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new UnitsError("Smart plug deviceId is already connected to another unit", 400);
      }

      handlePrismaError(error);
    }
  },

  async deleteSmartPlug(unitId: string) {
    await getUnitOrThrow(unitId);

    const existingSmartPlug = await prisma.smartPlugDevice.findUnique({
      where: { playStationId: unitId }
    });

    if (!existingSmartPlug) {
      throw new UnitsError("Smart plug not found", 404);
    }

    await prisma.smartPlugDevice.delete({
      where: { playStationId: unitId }
    });
  },

  async deleteUnit(id: string) {
    const existingUnit = await prisma.playStationUnit.findUnique({
      where: { id },
      include: {
        rentalSessions: {
          take: 1
        },
        packages: {
          take: 1
        },
        smartPlugDevice: true
      }
    });

    if (!existingUnit) {
      throw new UnitsError("Unit not found", 404);
    }

    if (existingUnit.rentalSessions.length > 0 || existingUnit.packages.length > 0 || existingUnit.smartPlugDevice) {
      throw new UnitsError("Unit cannot be deleted because it is still referenced", 400);
    }

    try {
      await prisma.playStationUnit.delete({
        where: { id }
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
};
