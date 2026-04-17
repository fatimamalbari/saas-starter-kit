import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { Membership, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      membership?: Membership;
    }
  }
}

export function resolveTenant(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const rawHeader = req.headers["x-tenant-id"];
  const tenantId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!tenantId || !UUID_RE.test(tenantId)) {
    res.status(400).json({ success: false, error: "Missing or invalid x-tenant-id header" });
    return;
  }

  req.tenantId = tenantId;
  next();
}

export async function requireMembership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.tenantId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId: req.user.userId,
        tenantId: req.tenantId,
      },
    },
  });

  if (!membership) {
    res.status(403).json({ success: false, error: "Not a member of this tenant" });
    return;
  }

  req.membership = membership;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
