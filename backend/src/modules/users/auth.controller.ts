import type { Role } from "@prisma/client";
import type { Request, Response } from "express";

import { AuthError, authService } from "./auth.service";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalNonEmptyString = (value: unknown): value is string | undefined =>
  value === undefined || (typeof value === "string" && value.trim().length > 0);

const handleError = (error: unknown, res: Response) => {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    try {
      const result = await authService.login(email.trim().toLowerCase(), password);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async register(req: Request, res: Response) {
    const { name, email, password } = req.body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    try {
      const result = await authService.registerOperator(req.user.role as Role, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "OPERATOR"
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async listUsers(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const users = await authService.listUsers(req.user.role as Role);
      return res.status(200).json(users);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async createUser(req: Request, res: Response) {
    const { name, email, password, role } = req.body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    };

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password) || role !== "OPERATOR") {
      return res.status(400).json({ message: "name, email, password, and role OPERATOR are required" });
    }

    try {
      const result = await authService.registerOperator(req.user.role as Role, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "OPERATOR"
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { name, email, password } = req.body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "User id is required" });
    }

    if (!isOptionalNonEmptyString(name) || !isOptionalNonEmptyString(email) || !isOptionalNonEmptyString(password)) {
      return res.status(400).json({ message: "name, email, and password must be non-empty strings when provided" });
    }

    if (name === undefined && email === undefined && password === undefined) {
      return res.status(400).json({ message: "At least one field must be provided" });
    }

    try {
      const result = await authService.updateUser(req.user.role as Role, id.trim(), {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(password ? { password } : {})
      });

      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isNonEmptyString(id)) {
      return res.status(400).json({ message: "User id is required" });
    }

    try {
      await authService.deleteUser(req.user.role as Role, id.trim(), req.user.userId);
      return res.status(204).send();
    } catch (error) {
      return handleError(error, res);
    }
  }
};
