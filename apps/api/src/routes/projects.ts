import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { resolveTenant, requireMembership, requireRole } from "../middleware/tenant";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

router.use(authenticate, resolveTenant, requireMembership);

// GET /api/projects — list projects for current tenant
router.get("/", async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: { tenantId: req.tenantId! } }),
  ]);

  res.json({ success: true, data: projects, total, page, limit });
});

// GET /api/projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, tenantId: req.tenantId! },
  });

  if (!project) {
    res.status(404).json({ success: false, error: "Project not found" });
    return;
  }

  res.json({ success: true, data: project });
});

// POST /api/projects — create project (OWNER/ADMIN)
router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        tenantId: req.tenantId!,
      },
    });

    res.status(201).json({ success: true, data: project });
  }
);

// PATCH /api/projects/:id — update project (OWNER/ADMIN)
router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: parsed.data,
    });

    res.json({ success: true, data: updated });
  }
);

// DELETE /api/projects/:id — delete project (OWNER/ADMIN)
router.delete(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });

    if (!project) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }

    await prisma.project.delete({ where: { id: project.id } });
    res.json({ success: true, data: { message: "Project deleted" } });
  }
);

export default router;
