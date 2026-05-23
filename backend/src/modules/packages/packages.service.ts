import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export class PackagesError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "PackagesError";
  }
}

type PackageFnbItemInput = {
  menuItemId: string;
  quantity: number;
};

type CreatePackageInput = {
  name: string;
  flatPrice: number;
  unitId: string;
  durationMinute: number;
  fnbItems: PackageFnbItemInput[];
};

type UpdatePackageInput = Partial<CreatePackageInput>;

const includeOptions = {
  unit: true,
  packageFnbItems: {
    include: {
      menuItem: true
    }
  }
} as const;

const handlePrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new PackagesError("Package name already exists", 400);
  }

  throw error;
};

const ensureUnitExists = async (unitId: string) => {
  const unit = await prisma.playStationUnit.findUnique({ where: { id: unitId } });

  if (!unit) {
    throw new PackagesError("Unit not found", 404);
  }
};

const ensureMenuItemsExist = async (fnbItems: PackageFnbItemInput[]) => {
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: fnbItems.map((item) => item.menuItemId)
      }
    },
    select: { id: true }
  });

  if (menuItems.length !== fnbItems.length) {
    throw new PackagesError("One or more menu items were not found", 404);
  }
};

export const packagesService = {
  async listPackages() {
    return prisma.package.findMany({
      include: includeOptions,
      orderBy: {
        name: "asc"
      }
    });
  },

  async createPackage(input: CreatePackageInput) {
    await ensureUnitExists(input.unitId);
    await ensureMenuItemsExist(input.fnbItems);

    try {
      return await prisma.package.create({
        data: {
          name: input.name,
          flatPrice: input.flatPrice,
          unitId: input.unitId,
          durationMinute: input.durationMinute,
          packageFnbItems: {
            create: input.fnbItems
          }
        },
        include: includeOptions
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updatePackage(id: string, input: UpdatePackageInput) {
    const existingPackage = await prisma.package.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      throw new PackagesError("Package not found", 404);
    }

    if (input.unitId) {
      await ensureUnitExists(input.unitId);
    }

    if (input.fnbItems) {
      await ensureMenuItemsExist(input.fnbItems);
    }

    try {
      return await prisma.package.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.flatPrice !== undefined ? { flatPrice: input.flatPrice } : {}),
          ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
          ...(input.durationMinute !== undefined ? { durationMinute: input.durationMinute } : {}),
          ...(input.fnbItems !== undefined
            ? {
                packageFnbItems: {
                  deleteMany: {},
                  create: input.fnbItems
                }
              }
            : {})
        },
        include: includeOptions
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async deletePackage(id: string) {
    const existingPackage = await prisma.package.findUnique({
      where: { id },
      include: {
        rentalSessions: {
          take: 1
        }
      }
    });

    if (!existingPackage) {
      throw new PackagesError("Package not found", 404);
    }

    if (existingPackage.rentalSessions.length > 0) {
      throw new PackagesError("Package cannot be deleted because it is used by rental sessions", 400);
    }

    await prisma.package.delete({
      where: { id }
    });
  }
};
