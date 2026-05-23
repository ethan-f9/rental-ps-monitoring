import type { Request, Response } from "express";

import { MenuError, menuService } from "./menu.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const handleError = (error: unknown, res: Response) => {
  if (error instanceof MenuError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const menuController = {
  async listMenuItems(_req: Request, res: Response) {
    try {
      const items = await menuService.listMenuItems();
      return res.status(200).json(items);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createMenuItem(req: Request, res: Response) {
    const { name, price, category } = req.body as {
      name?: unknown;
      price?: unknown;
      category?: unknown;
    };

    if (!isNonEmptyString(name) || !isPositiveNumber(price) || !isNonEmptyString(category)) {
      return res.status(400).json({ message: "name, price, and category are required" });
    }

    try {
      const item = await menuService.createMenuItem({
        name: name.trim(),
        price,
        category: category.trim()
      });

      return res.status(201).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateMenuItem(req: Request, res: Response) {
    const { id } = req.params;
    const { name, price, category } = req.body as {
      name?: unknown;
      price?: unknown;
      category?: unknown;
    };

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Menu item id is required" });
    }

    const updateData: {
      name?: string;
      price?: number;
      category?: string;
    } = {};

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return res.status(400).json({ message: "name must be a non-empty string" });
      }

      updateData.name = name.trim();
    }

    if (price !== undefined) {
      if (!isPositiveNumber(price)) {
        return res.status(400).json({ message: "price must be a positive number" });
      }

      updateData.price = price;
    }

    if (category !== undefined) {
      if (!isNonEmptyString(category)) {
        return res.status(400).json({ message: "category must be a non-empty string" });
      }

      updateData.category = category.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "At least one field must be provided" });
    }

    try {
      const item = await menuService.updateMenuItem(id.trim(), updateData);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deleteMenuItem(req: Request, res: Response) {
    const { id } = req.params;

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Menu item id is required" });
    }

    try {
      await menuService.deleteMenuItem(id.trim());
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
};
