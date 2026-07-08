export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT';
  isActive: boolean;
}
