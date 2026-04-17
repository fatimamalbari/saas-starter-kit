export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface MembershipInfo {
  userId: string;
  tenantId: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
