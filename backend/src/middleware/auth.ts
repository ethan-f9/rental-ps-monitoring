import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { env } from "../config/env";

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7).trim() || null;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  if (!env.jwtSecret) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== Role.OWNER) {
    return res.status(403).json({ message: "Owner access required" });
  }

  return next();
};

export const requireOperator = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== Role.OWNER && req.user.role !== Role.OPERATOR) {
    return res.status(403).json({ message: "Operator access required" });
  }

  return next();
};
