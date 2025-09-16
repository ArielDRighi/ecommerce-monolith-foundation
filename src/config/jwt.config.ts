import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
  refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
}));
