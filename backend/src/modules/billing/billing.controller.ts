import type { Request, Response } from "express";

import { BillingError, billingService } from "./billing.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const handleBillingError = (error: unknown, res: Response) => {
  if (error instanceof BillingError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const billingController = {
  async startSession(req: Request, res: Response) {
    const { packageId, unitId, durationMinute } = req.body as {
      packageId?: unknown;
      unitId?: unknown;
      durationMinute?: unknown;
    };

    const hasPackageMode = isNonEmptyString(packageId);
    const hasDirectMode = isNonEmptyString(unitId) && isPositiveNumber(durationMinute);

    if (!hasPackageMode && !hasDirectMode) {
      return res.status(400).json({ message: "Provide either packageId or unitId with durationMinute" });
    }

    if (hasPackageMode && (unitId !== undefined || durationMinute !== undefined)) {
      return res.status(400).json({ message: "packageId mode cannot be combined with unitId or durationMinute" });
    }

    try {
      const session = hasPackageMode
        ? await billingService.startSession({ packageId: packageId.trim() })
        : await billingService.startSession({ unitId: (unitId as string).trim(), durationMinute });
      return res.status(201).json(session);
    } catch (error) {
      return handleBillingError(error, res);
    }
  },

  async stopSession(req: Request, res: Response) {
    const { sessionId } = req.params;

    if (!isNonEmptyString(sessionId)) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    try {
      const session = await billingService.stopSession(sessionId.trim());
      return res.status(200).json(session);
    } catch (error) {
      return handleBillingError(error, res);
    }
  },

  async extendSession(req: Request, res: Response) {
    const { sessionId } = req.params;
    const { extraMinutes } = req.body as {
      extraMinutes?: unknown;
    };

    if (!isNonEmptyString(sessionId) || !isPositiveNumber(extraMinutes)) {
      return res.status(400).json({ message: "sessionId and extraMinutes are required" });
    }

    try {
      const session = await billingService.extendSession(sessionId.trim(), extraMinutes);
      return res.status(200).json(session);
    } catch (error) {
      return handleBillingError(error, res);
    }
  },

  async getActiveSessions(_req: Request, res: Response) {
    try {
      const sessions = await billingService.getActiveSessions();
      return res.status(200).json(sessions);
    } catch (error) {
      return handleBillingError(error, res);
    }
  },

  async getSessionLogs(_req: Request, res: Response) {
    try {
      const sessions = await billingService.getSessionLogs();
      return res.status(200).json(sessions);
    } catch (error) {
      return handleBillingError(error, res);
    }
  }
};
