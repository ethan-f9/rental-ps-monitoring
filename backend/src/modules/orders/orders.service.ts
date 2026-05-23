import { OrderStatus, RentalStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export class OrdersError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "OrdersError";
  }
}

const ACTIVE_SESSION_STATUSES: RentalStatus[] = [RentalStatus.RUNNING, RentalStatus.PAUSED];

const orderInclude = {
  menuItem: true,
  rentalSession: {
    include: {
      playStation: true,
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
    }
  }
} as const;

export const ordersService = {
  async createOrder(sessionId: string | null, menuItemId: string, quantity: number) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId }
    });

    if (!menuItem) {
      throw new OrdersError("Menu item not found", 404);
    }

    if (!menuItem.isActive) {
      throw new OrdersError("Menu item is inactive", 400);
    }

    if (sessionId) {
      const session = await prisma.rentalSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new OrdersError("Rental session not found", 404);
      }

      if (!ACTIVE_SESSION_STATUSES.includes(session.status)) {
        throw new OrdersError("Orders can only be added to active sessions", 400);
      }
    }

    const totalPrice = menuItem.price.mul(quantity);

    return prisma.order.create({
      data: {
        rentalSessionId: sessionId,
        menuItemId,
        quantity,
        totalPrice,
        status: OrderStatus.SERVED
      },
      include: orderInclude
    });
  },

  async updateOrderStatus(id: string, status: "SERVED" | "CANCELLED") {
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new OrdersError("Order not found", 404);
    }

    return prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude
    });
  },

  async getOrderLogs(type?: "fnb" | "session") {
    return prisma.order.findMany({
      where:
        type === "fnb"
          ? { rentalSessionId: null }
          : type === "session"
            ? { rentalSessionId: { not: null } }
            : undefined,
      include: orderInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
