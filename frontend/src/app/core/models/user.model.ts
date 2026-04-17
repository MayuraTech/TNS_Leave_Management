export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMINISTRATOR';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  isActive: boolean;
  roles: UserRole[];
  departmentId?: number;
  teamId?: number;
  managerId?: number;
  managerName?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  roles: UserRole[];
  token: string;
  expiresIn: number;
}
