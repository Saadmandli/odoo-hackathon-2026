import type { Role } from "@prisma/client";
import { getSession, type SessionUser } from "./auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Require a logged-in user; optionally restrict to roles. Throws AuthError. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError("Not authenticated", 401);
  if (roles && roles.length) {
    if (!roles.includes(user.role))
      throw new AuthError("Forbidden: insufficient role", 403);
  }
  return user;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Main System Admin",
  BUYER: "Buyer",
  SELLER: "Seller",
};
