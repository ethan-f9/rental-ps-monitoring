import { PrismaClient, Role, UnitStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const hashedPassword = await bcrypt.hash("owner123", SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: "owner@rental.com" },
    update: {
      name: "Owner",
      password: hashedPassword,
      role: Role.OWNER
    },
    create: {
      name: "Owner",
      email: "owner@rental.com",
      password: hashedPassword,
      role: Role.OWNER
    }
  });

  const [ps3, ps4, ps5] = await Promise.all([
    prisma.playStationUnit.upsert({
      where: { name: "PS3-1" },
      update: { status: UnitStatus.IDLE, pricePerHour: 6000 },
      create: {
        name: "PS3-1",
        status: UnitStatus.IDLE,
        pricePerHour: 6000
      }
    }),
    prisma.playStationUnit.upsert({
      where: { name: "PS4-1" },
      update: { status: UnitStatus.IDLE, pricePerHour: 8000 },
      create: {
        name: "PS4-1",
        status: UnitStatus.IDLE,
        pricePerHour: 8000
      }
    }),
    prisma.playStationUnit.upsert({
      where: { name: "PS5-1" },
      update: { status: UnitStatus.IDLE, pricePerHour: 10000 },
      create: {
        name: "PS5-1",
        status: UnitStatus.IDLE,
        pricePerHour: 10000
      }
    })
  ]);

  await prisma.menuItem.createMany({
    data: [
      {
        name: "Nutri Sari Jeruk",
        price: 5000,
        category: "Drink",
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  const nutriSari = await prisma.menuItem.findFirst({
    where: {
      name: "Nutri Sari Jeruk",
      category: "Drink"
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!nutriSari) {
    throw new Error("Failed to seed Nutri Sari Jeruk menu item");
  }

  const morningPackage = await prisma.package.upsert({
    where: { name: "Paket Pagi" },
    update: {
      flatPrice: 30000,
      unitId: ps3.id,
      durationMinute: 360
    },
    create: {
      name: "Paket Pagi",
      flatPrice: 30000,
      unitId: ps3.id,
      durationMinute: 360
    }
  });

  await prisma.packageFnbItem.upsert({
    where: {
      packageId_menuItemId: {
        packageId: morningPackage.id,
        menuItemId: nutriSari.id
      }
    },
    update: {
      quantity: 1
    },
    create: {
      packageId: morningPackage.id,
      menuItemId: nutriSari.id,
      quantity: 1
    }
  });

  console.log("Initial owner account seeded: owner@rental.com");
  console.log("PlayStation units seeded: PS3-1, PS4-1, PS5-1");
  console.log("Package seeded: Paket Pagi with Nutri Sari Jeruk x1");
}

main()
  .catch((error) => {
    console.error("Failed to seed initial data", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
