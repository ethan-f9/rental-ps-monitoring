import type { Request, Response } from "express";

import { UnitsError, unitsService } from "./units.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const handleError = (error: unknown, res: Response) => {
  if (error instanceof UnitsError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const unitsController = {
  async listUnits(_req: Request, res: Response) {
    try {
      const units = await unitsService.listUnits();
      return res.status(200).json(units);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createUnit(req: Request, res: Response) {
    const { name, pricePerHour } = req.body as {
      name?: unknown;
      pricePerHour?: unknown;
    };

    if (!isNonEmptyString(name) || !isPositiveNumber(pricePerHour)) {
      return res.status(400).json({ message: "name and pricePerHour are required" });
    }

    try {
      const unit = await unitsService.createUnit(name.trim(), pricePerHour);
      return res.status(201).json(unit);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateUnit(req: Request, res: Response) {
    const { id } = req.params;
    const { name, pricePerHour } = req.body as {
      name?: unknown;
      pricePerHour?: unknown;
    };

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    if (!isNonEmptyString(name) || !isPositiveNumber(pricePerHour)) {
      return res.status(400).json({ message: "name and pricePerHour are required" });
    }

    try {
      const unit = await unitsService.updateUnit(id.trim(), name.trim(), pricePerHour);
      return res.status(200).json(unit);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getSmartPlug(req: Request, res: Response) {
    const { unitId } = req.params;

    if (!isNonEmptyString(unitId)) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    try {
      const smartPlug = await unitsService.getSmartPlug(unitId.trim());
      return res.status(200).json(smartPlug);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async saveSmartPlug(req: Request, res: Response) {
    const { unitId } = req.params;
    const { deviceId, clientId, clientSecret } = req.body as {
      deviceId?: unknown;
      clientId?: unknown;
      clientSecret?: unknown;
    };

    if (!isNonEmptyString(unitId)) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    if (!isNonEmptyString(deviceId) || !isNonEmptyString(clientId) || !isNonEmptyString(clientSecret)) {
      return res.status(400).json({ message: "deviceId, clientId, and clientSecret are required" });
    }

    try {
      const smartPlug = await unitsService.upsertSmartPlug(unitId.trim(), {
        deviceId: deviceId.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim()
      });
      return res.status(200).json(smartPlug);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deleteSmartPlug(req: Request, res: Response) {
    const { unitId } = req.params;

    if (!isNonEmptyString(unitId)) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    try {
      await unitsService.deleteSmartPlug(unitId.trim());
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deleteUnit(req: Request, res: Response) {
    const { id } = req.params;

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "Unit id is required" });
    }

    try {
      await unitsService.deleteUnit(id.trim());
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
};
