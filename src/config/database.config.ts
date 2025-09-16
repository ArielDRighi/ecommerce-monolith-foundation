import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ecommerce_catalog',
  synchronize: process.env.NODE_ENV === 'development',
  logging:
    process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  subscribers: [join(__dirname, '..', 'database', 'subscribers', '*{.ts,.js}')],
  migrationsRun: process.env.NODE_ENV === 'production',
  migrationsTableName: 'migrations',
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'src/database/migrations',
    subscribersDir: 'src/database/subscribers',
  },
  // Connection pool settings for production
  extra: {
    max: 20, // Maximum number of connections in pool
    min: 5, // Minimum number of connections in pool
    idle_timeout: 20000,
    connection_timeout: 2000,
  },
}));
