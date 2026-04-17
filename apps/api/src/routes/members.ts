import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { resolveTenant, requireMembership, requireRole } from "../middleware/tenant";
import { signInviteToken, verifyInviteToken } from "../lib/jwt";

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

// GET /api/members/verify-invite/:token — public, verify invite token and return invite details
router.get("/verify-invite/:token", async (req: Request, res: Response) => {
  try {
    const payload = verifyInviteToken(req.params.token as string);

    const invite = await prisma.invite.findUnique({
      where: { id: payload.inviteId },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (!invite || invite.status !== "PENDING") {
      res.status(404).json({ success: false, error: "Invite not found or already used" });
      return;
    }

    if (invite.expiresAt < new Date()) {
      res.status(410).json({ success: false, error: "Invite has expired" });
      return;
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        tenant: invite.tenant,
      },
    });
  } catch {
    res.status(400).json({ success: false, error: "Invalid invite token" });
  }
});

// POST /api/members/accept-invite — must be BEFORE requireMembership (invitee is not yet a member)
router.post("/accept-invite", authenticate, resolveTenant, async (req: Request, res: Response) => {
  const invite = await prisma.invite.findUnique({
    where: {
      email_tenantId: {
        email: req.user!.email,
        tenantId: req.tenantId!,
      },
    },
  });

  if (!invite || invite.status !== "PENDING") {
    res.status(404).json({ success: false, error: "No pending invite found" });
    return;
  }

  if (invite.expiresAt < new Date()) {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    res.status(410).json({ success: false, error: "Invite has expired" });
    return;
  }

  const [membership] = await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: req.user!.userId,
        tenantId: req.tenantId!,
        role: invite.role,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  res.json({ success: true, data: membership });
});

// All routes below require tenant membership
router.use(authenticate, resolveTenant, requireMembership);

// GET /api/members — list tenant members
router.get("/", async (req: Request, res: Response) => {
  const members = await prisma.membership.findMany({
    where: { tenantId: req.tenantId! },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({
    success: true,
    data: members.map((m: any) => ({
      id: m.id,
      ...m.user,
      role: m.role,
      joinedAt: m.createdAt,
    })),
  });
});

// POST /api/members/invite — invite user to tenant (OWNER/ADMIN)
router.post(
  "/invite",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const { email, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: existingUser.id,
            tenantId: req.tenantId!,
          },
        },
      });
      if (existingMembership) {
        res.status(409).json({ success: false, error: "User is already a member" });
        return;
      }
    }

    const invite = await prisma.invite.upsert({
      where: {
        email_tenantId: { email, tenantId: req.tenantId! },
      },
      update: { role, status: "PENDING", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      create: {
        email,
        role,
        tenantId: req.tenantId!,
        invitedById: req.user!.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteToken = signInviteToken({
      inviteId: invite.id,
      email: invite.email,
      tenantId: req.tenantId!,
      role: invite.role,
    });

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite/${inviteToken}`;

    res.status(201).json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        inviteLink,
      },
    });
  }
);

// PATCH /api/members/:userId/role — change member role (OWNER only)
router.patch(
  "/:userId/role",
  requireRole("OWNER"),
  async (req: Request, res: Response) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: req.params.userId as string,
          tenantId: req.tenantId!,
        },
      },
    });

    if (!membership) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }

    if (membership.role === "OWNER") {
      res.status(403).json({ success: false, error: "Cannot change owner role" });
      return;
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { role: parsed.data.role },
    });

    res.json({ success: true, data: updated });
  }
);

// DELETE /api/members/:userId — remove member (OWNER/ADMIN)
router.delete(
  "/:userId",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response) => {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: req.params.userId as string,
          tenantId: req.tenantId!,
        },
      },
    });

    if (!membership) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }

    if (membership.role === "OWNER") {
      res.status(403).json({ success: false, error: "Cannot remove the owner" });
      return;
    }

    await prisma.membership.delete({ where: { id: membership.id } });
    res.json({ success: true, data: { message: "Member removed" } });
  }
);

export default router;
