import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/password";
import { signToken, verifyInviteToken } from "../lib/jwt";
import { authenticate } from "../middleware/auth";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup — create user + tenant, user becomes OWNER
router.post("/signup", async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const { email, name, password, tenantName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, error: "Email already registered" });
    return;
  }

  const slug = tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    res.status(409).json({ success: false, error: "Tenant slug already taken" });
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      memberships: {
        create: {
          role: "OWNER",
          tenant: {
            create: { name: tenantName, slug },
          },
        },
      },
    },
    include: { memberships: { include: { tenant: true } } },
  });

  const token = signToken({ userId: user.id, email: user.email });
  const tenant = user.memberships[0].tenant;

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    },
  });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { tenant: true } } },
  });

  if (!user || !(await comparePassword(password, user.password))) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      tenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role,
      })),
    },
  });
});

// POST /api/auth/signup-with-invite — create account and auto-join tenant via invite token
const inviteSignupSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  inviteToken: z.string(),
});

router.post("/signup-with-invite", async (req: Request, res: Response) => {
  const parsed = inviteSignupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const { name, password, inviteToken } = parsed.data;

  let payload;
  try {
    payload = verifyInviteToken(inviteToken);
  } catch {
    res.status(400).json({ success: false, error: "Invalid or expired invite token" });
    return;
  }

  const invite = await prisma.invite.findUnique({
    where: { id: payload.inviteId },
    include: { tenant: true },
  });

  if (!invite || invite.status !== "PENDING") {
    res.status(404).json({ success: false, error: "Invite not found or already used" });
    return;
  }

  if (invite.expiresAt < new Date()) {
    await prisma.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    res.status(410).json({ success: false, error: "Invite has expired" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    res.status(409).json({ success: false, error: "Email already registered. Please login and accept the invite." });
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: invite.email,
      name,
      password: hashed,
      memberships: {
        create: {
          role: invite.role,
          tenantId: invite.tenantId,
        },
      },
    },
  });

  await prisma.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: invite.tenant.id, name: invite.tenant.name, slug: invite.tenant.slug },
    },
  });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { memberships: { include: { tenant: true } } },
  });

  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name },
      tenants: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role,
      })),
    },
  });
});

export default router;
