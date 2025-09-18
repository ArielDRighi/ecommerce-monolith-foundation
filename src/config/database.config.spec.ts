import databaseConfig from './database.config';

describe('Database Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no environment variables are set', () => {
    delete process.env.DATABASE_HOST;
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_USER;
    delete process.env.DATABASE_PASSWORD;
    delete process.env.DATABASE_NAME;
    delete process.env.NODE_ENV;

    const config = databaseConfig();

    expect(config.type).toBe('postgres');
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('postgres');
    expect(config.password).toBe('postgres');
    expect(config.database).toBe('ecommerce_catalog');
    expect(config.synchronize).toBe(false);
    expect(config.ssl).toBe(false);
    expect(config.migrationsRun).toBe(false);
  });

  it('should use environment variables when provided', () => {
    process.env.DATABASE_HOST = 'db.example.com';
    process.env.DATABASE_PORT = '3306';
    process.env.DATABASE_USER = 'admin';
    process.env.DATABASE_PASSWORD = 'secret123';
    process.env.DATABASE_NAME = 'prod_db';
    process.env.NODE_ENV = 'production';

    const config = databaseConfig();

    expect(config.host).toBe('db.example.com');
    expect(config.port).toBe(3306);
    expect(config.username).toBe('admin');
    expect(config.password).toBe('secret123');
    expect(config.database).toBe('prod_db');
    expect(config.synchronize).toBe(false);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
    expect(config.migrationsRun).toBe(true);
  });

  it('should parse port as integer', () => {
    process.env.DATABASE_PORT = '9000';

    const config = databaseConfig();

    expect(config.port).toBe(9000);
    expect(typeof config.port).toBe('number');
  });

  it('should handle invalid port value gracefully', () => {
    process.env.DATABASE_PORT = 'invalid';

    const config = databaseConfig();

    expect(config.port).toBeNaN();
  });

  it('should enable synchronize in development environment', () => {
    process.env.NODE_ENV = 'development';

    const config = databaseConfig();

    expect(config.synchronize).toBe(true);
  });

  it('should configure logging for development', () => {
    process.env.NODE_ENV = 'development';

    const config = databaseConfig();

    expect(config.logging).toEqual(['query', 'error']);
  });

  it('should configure logging for production to only show errors', () => {
    process.env.NODE_ENV = 'production';

    const config = databaseConfig();

    expect(config.logging).toEqual(['error']);
  });

  it('should configure SSL for production environment', () => {
    process.env.NODE_ENV = 'production';

    const config = databaseConfig();

    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('should disable SSL for non-production environment', () => {
    process.env.NODE_ENV = 'development';

    const config = databaseConfig();

    expect(config.ssl).toBe(false);
  });

  it('should enable migrations run in production', () => {
    process.env.NODE_ENV = 'production';

    const config = databaseConfig();

    expect(config.migrationsRun).toBe(true);
  });

  it('should disable migrations run in non-production', () => {
    process.env.NODE_ENV = 'development';

    const config = databaseConfig();

    expect(config.migrationsRun).toBe(false);
  });

  it('should have correct connection pool settings', () => {
    const config = databaseConfig();

    expect(config.extra).toEqual({
      max: 20,
      min: 5,
      idle_timeout: 20000,
      connection_timeout: 2000,
    });
  });

  it('should have correct migration table name', () => {
    const config = databaseConfig();

    expect(config.migrationsTableName).toBe('migrations');
  });

  it('should have correct entities and migrations paths', () => {
    const config = databaseConfig();

    expect(config.entities).toHaveLength(1);
    expect(config.migrations).toHaveLength(1);
    expect(config.subscribers).toHaveLength(1);
  });
});
