import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
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
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export function signInviteToken(payload: InviteTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyInviteToken(token: string): InviteTokenPayload {
  return jwt.verify(token, SECRET) as InviteTokenPayload;
}
