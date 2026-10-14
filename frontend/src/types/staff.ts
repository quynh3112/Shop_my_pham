import type { Permission } from "../utils/permissions";

export interface Staff {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

export interface StaffCreate {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  permissions: Permission[];
}

export interface StaffUpdate {
  fullName?: string;
  phone?: string;
  permissions?: Permission[];
  isActive?: boolean;
}
