import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { resolveTenant, requireMembership, requireRole } from "../middleware/tenant";

const router = Router();

const updateTenantSchema = z.object({
  name: z.string().min(1).max(100),
});

// All tenant routes require auth + tenant header + membership
router.use(authenticate, resolveTenant, requireMembership);

// GET /api/tenants/current — get current tenant details
router.get("/current", async (req: Request, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenantId! },
    include: {
      memberships: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
      _count: { select: { projects: true } },
    },
  });

  if (!tenant) {
    res.status(404).json({ success: false, error: "Tenant not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      memberCount: tenant.memberships.length,
      projectCount: tenant._count.projects,
      members: tenant.memberships.map((m: any) => ({
        ...m.user,
        role: m.role,
      })),
    },
  });
});

// PATCH /api/tenants/current — update tenant (OWNER/ADMIN only)
router.patch(
  "/current",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = updateTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId! },
      data: { name: parsed.data.name },
    });

    res.json({
      success: true,
      data: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    });
  }
);

export default router;
