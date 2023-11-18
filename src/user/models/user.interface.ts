import { Role } from './role.enum';

export interface User {
  uid: string;
  profileName?: string;
  email?: string;
  mobilePhone?: string;
  firstname?: string;
  lastname?: string;
  profileImage?: string;
  role: Role;

  isInitProfile?: boolean;
  isDeleted?: boolean;
  deletedDate?: Date;

  publicAddress: string;
  nonce?: number;

  createdAt: Date;
  updatedAt: Date;
}
