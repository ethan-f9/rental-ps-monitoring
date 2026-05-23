import type { Request, Response } from "express";

import { PackagesError, packagesService } from "./packages.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isValidFnbItems = (
  value: unknown
): value is Array<{ menuItemId: string; quantity: number }> =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      isNonEmptyString((item as { menuItemId?: unknown }).menuItemId) &&
      isPositiveNumber((item as { quantity?: unknown }).quantity)
  );

const handleError = (error: unknown, res: Response) => {
  if (error instanceof PackagesError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const packagesController = {
  async listPackages(_req: Request, res: Response) {
    try {
      const packages = await packagesService.listPackages();
      return res.status(200).json(packages);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createPackage(req: Request, res: Response) {
    const { name, flatPrice, unitId, durationMinute, fnbItems } = req.body as {
      name?: unknown;
      flatPrice?: unknown;
      unitId?: unknown;
      durationMinute?: unknown;
      fnbItems?: unknown;
    };

    if (
      !isNonEmptyString(name) ||
      !isPositiveNumber(flatPrice) ||
      !isNonEmptyString(unitId) ||
      !isPositiveNumber(durationMinute) ||
      !isValidFnbItems(fnbItems)
    ) {
      return res.status(400).json({ message: "name, flatPrice, unitId, durationMinute, and valid fnbItems are required" });
    }

    try {
      const createdPackage = await packagesService.createPackage({
        name: name.trim(),
        flatPrice,
        unitId: unitId.trim(),
        durationMinute,
        fnbItems: fnbItems.map((item) => ({
          menuItemId: item.menuItemId.trim(),
          quantity: item.quantity
        }))
      });

      return res.status(201).json(createdPackage);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updatePackage(req: Request, res: Response) {
    const { id } = req.params;
    const { name, flatPrice, unitId, durationMinute, fnbItems } = req.body as {
      name?: unknown;
      flatPrice?: unknown;
      unitId?: unknown;
      durationMinute?: unknown;
      fnbItems?: unknown;
    };

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Package id is required" });
    }

    if (
      name !== undefined &&
      !isNonEmptyString(name)
    ) {
      return res.status(400).json({ message: "name must be a non-empty string" });
    }

    if (flatPrice !== undefined && !isPositiveNumber(flatPrice)) {
      return res.status(400).json({ message: "flatPrice must be a positive number" });
    }

    if (unitId !== undefined && !isNonEmptyString(unitId)) {
      return res.status(400).json({ message: "unitId must be a non-empty string" });
    }

    if (durationMinute !== undefined && !isPositiveNumber(durationMinute)) {
      return res.status(400).json({ message: "durationMinute must be a positive number" });
    }

    if (fnbItems !== undefined && !isValidFnbItems(fnbItems)) {
      return res.status(400).json({ message: "fnbItems must be an array of menuItemId and quantity" });
    }

    if (
      name === undefined &&
      flatPrice === undefined &&
      unitId === undefined &&
      durationMinute === undefined &&
      fnbItems === undefined
    ) {
      return res.status(400).json({ message: "At least one field must be provided" });
    }

    try {
      const updatedPackage = await packagesService.updatePackage(id.trim(), {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(flatPrice !== undefined ? { flatPrice } : {}),
        ...(unitId !== undefined ? { unitId: unitId.trim() } : {}),
        ...(durationMinute !== undefined ? { durationMinute } : {}),
        ...(fnbItems !== undefined
          ? {
              fnbItems: fnbItems.map((item) => ({
                menuItemId: item.menuItemId.trim(),
                quantity: item.quantity
              }))
            }
          : {})
      });
      return res.status(200).json(updatedPackage);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deletePackage(req: Request, res: Response) {
    const { id } = req.params;

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Package id is required" });
    }

    try {
      await packagesService.deletePackage(id.trim());
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
};
