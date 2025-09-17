import typeormConfig from './typeorm.config';
import { DataSource } from 'typeorm';

describe('TypeORM Config', () => {
  it('should export a DataSource instance', () => {
    expect(typeormConfig).toBeInstanceOf(DataSource);
  });

  it('should have correct database type', () => {
    expect(typeormConfig.options.type).toBe('postgres');
  });

  it('should have correct migration configuration', () => {
    expect(typeormConfig.options.migrationsTableName).toBe('migrations');
    expect(typeormConfig.options.synchronize).toBe(false);
    expect(typeormConfig.options.migrationsRun).toBe(false);
  });

  it('should have entities, migrations, and subscribers paths configured', () => {
    expect(typeormConfig.options.entities).toBeDefined();
    expect(typeormConfig.options.migrations).toBeDefined();
    expect(typeormConfig.options.subscribers).toBeDefined();
    expect(Array.isArray(typeormConfig.options.entities)).toBe(true);
    expect(Array.isArray(typeormConfig.options.migrations)).toBe(true);
    expect(Array.isArray(typeormConfig.options.subscribers)).toBe(true);
  });

  it('should have database connection configuration', () => {
    expect(typeormConfig.options).toBeDefined();
    expect(typeormConfig.isInitialized).toBe(false);
  });
});
