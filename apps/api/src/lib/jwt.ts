import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const SECRET: string = process.env.JWT_SECRET;
const EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface InviteTokenPayload {
  inviteId: string;
  email: string;
  tenantId: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as unknown as JwtPayload;
}

export function signInviteToken(payload: InviteTokenPayload): string {
  return jwt.sign(payload as object, SECRET, { expiresIn: "7d" });
}

export function verifyInviteToken(token: string): InviteTokenPayload {
  return jwt.verify(token, SECRET) as unknown as InviteTokenPayload;
}
