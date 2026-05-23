import { Prisma, type Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

const SALT_ROUNDS = 10;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type JwtPayload = {
  userId: string;
  email: string;
  role: Role;
};

type CreateOperatorInput = {
  name: string;
  email: string;
  password: string;
  role?: Role;
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const toAuthUser = (user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const signToken = (payload: JwtPayload) => {
  if (!env.jwtSecret) {
    throw new AuthError("JWT secret is not configured", 500);
  }

  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

const ensureOwner = (currentUserRole: Role) => {
  if (currentUserRole !== "OWNER") {
    throw new AuthError("Only owners can manage users", 403);
  }
};

const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

const handleUserConflict = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AuthError("Email is already registered", 400);
  }

  throw error;
};

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AuthError("Invalid email or password", 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password", 400);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: toAuthUser(user)
    };
  },

  async registerOperator(currentUserRole: Role, input: CreateOperatorInput) {
    ensureOwner(currentUserRole);

    try {
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: await hashPassword(input.password),
          role: input.role ?? "OPERATOR"
        }
      });

      return { user: toAuthUser(user) };
    } catch (error) {
      handleUserConflict(error);
    }
  },

  async listUsers(currentUserRole: Role) {
    ensureOwner(currentUserRole);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    return users.map(toAuthUser);
  },

  async updateUser(currentUserRole: Role, userId: string, input: UpdateUserInput) {
    ensureOwner(currentUserRole);

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      throw new AuthError("User not found", 404);
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.email ? { email: input.email } : {}),
          ...(input.password ? { password: await hashPassword(input.password) } : {})
        }
      });

      return { user: toAuthUser(updatedUser) };
    } catch (error) {
      handleUserConflict(error);
    }
  },

  async deleteUser(currentUserRole: Role, userId: string, currentUserId: string) {
    ensureOwner(currentUserRole);

    if (userId === currentUserId) {
      throw new AuthError("You cannot delete your own account", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      throw new AuthError("User not found", 404);
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }
};
