import type { Request, Response } from "express";

import { OrdersError, ordersService } from "./orders.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isValidOrderStatus = (value: unknown): value is "SERVED" | "CANCELLED" =>
  value === "SERVED" || value === "CANCELLED";

const handleError = (error: unknown, res: Response) => {
  if (error instanceof OrdersError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const ordersController = {
  async createOrder(req: Request, res: Response) {
    const { sessionId, menuItemId, quantity } = req.body as {
      sessionId?: unknown;
      menuItemId?: unknown;
      quantity?: unknown;
    };

    if ((sessionId !== undefined && sessionId !== null && !isNonEmptyString(sessionId)) || !isNonEmptyString(menuItemId) || !isPositiveInteger(quantity)) {
      return res.status(400).json({ message: "menuItemId and quantity are required, and sessionId must be a non-empty string when provided" });
    }

    try {
      const order = await ordersService.createOrder(
        typeof sessionId === "string" ? sessionId.trim() : null,
        menuItemId.trim(),
        quantity
      );
      return res.status(201).json(order);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateOrderStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body as {
      status?: unknown;
    };

    if (!isNonEmptyString(id) || !isValidOrderStatus(status)) {
      return res.status(400).json({ message: "id is required and status must be SERVED or CANCELLED" });
    }

    try {
      const order = await ordersService.updateOrderStatus(id.trim(), status);
      return res.status(200).json(order);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getOrderLogs(req: Request, res: Response) {
    const { type } = req.query as {
      type?: unknown;
    };

    if (type !== undefined && type !== "fnb" && type !== "session") {
      return res.status(400).json({ message: "type must be fnb or session when provided" });
    }

    try {
      const orders = await ordersService.getOrderLogs(type as "fnb" | "session" | undefined);
      return res.status(200).json(orders);
    } catch (error) {
      return handleError(error, res);
    }
  }
};
