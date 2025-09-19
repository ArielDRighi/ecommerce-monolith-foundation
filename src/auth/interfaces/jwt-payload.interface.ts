import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string; // JWT ID for blacklist tracking
  iat?: number;
  exp?: number;
}
