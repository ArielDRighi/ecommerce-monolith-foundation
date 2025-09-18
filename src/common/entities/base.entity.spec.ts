import { BaseEntity } from './base.entity';

// Create a concrete implementation for testing
class TestEntity extends BaseEntity {
  name: string;

  // Add a method to test function coverage
  getEntityInfo(): string {
    return `Entity ${this.id} created at ${this.createdAt?.toISOString() || 'unknown'}`;
  }
}

describe('BaseEntity', () => {
  let entity: TestEntity;

  beforeEach(() => {
    entity = new TestEntity();
  });

  describe('constructor', () => {
    it('should create a new entity instance', () => {
      expect(entity).toBeInstanceOf(BaseEntity);
      expect(entity).toBeInstanceOf(TestEntity);
    });

    it('should allow setting isActive property', () => {
      entity.isActive = true;
      expect(entity.isActive).toBe(true);

      entity.isActive = false;
      expect(entity.isActive).toBe(false);
    });
  });

  describe('properties', () => {
    it('should set and get id correctly', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      entity.id = id;

      expect(entity.id).toBe(id);
    });

    it('should set and get createdAt correctly', () => {
      const date = new Date('2023-12-01T10:00:00Z');
      entity.createdAt = date;

      expect(entity.createdAt).toBe(date);
    });

    it('should set and get updatedAt correctly', () => {
      const date = new Date('2023-12-02T10:00:00Z');
      entity.updatedAt = date;

      expect(entity.updatedAt).toBe(date);
    });

    it('should set and get deletedAt correctly', () => {
      const date = new Date('2023-12-03T10:00:00Z');
      entity.deletedAt = date;

      expect(entity.deletedAt).toBe(date);
    });

    it('should handle undefined deletedAt', () => {
      entity.deletedAt = undefined;

      expect(entity.deletedAt).toBeUndefined();
    });

    it('should set and get isActive correctly', () => {
      entity.isActive = false;
      expect(entity.isActive).toBe(false);

      entity.isActive = true;
      expect(entity.isActive).toBe(true);
    });
  });

  describe('soft delete functionality', () => {
    it('should support soft delete through deletedAt', () => {
      expect(entity.deletedAt).toBeUndefined();

      // Simulate soft delete
      entity.deletedAt = new Date();

      expect(entity.deletedAt).toBeInstanceOf(Date);
    });

    it('should be considered not deleted when deletedAt is undefined', () => {
      entity.deletedAt = undefined;

      expect(entity.deletedAt).toBeUndefined();
    });
  });

  describe('entity state', () => {
    it('should track entity state changes', () => {
      const createdDate = new Date('2023-01-01');
      const updatedDate = new Date('2023-06-01');

      entity.createdAt = createdDate;
      entity.updatedAt = updatedDate;
      entity.isActive = true;

      expect(entity.createdAt).toBe(createdDate);
      expect(entity.updatedAt).toBe(updatedDate);
      expect(entity.isActive).toBe(true);
      expect(entity.deletedAt).toBeUndefined();
    });

    it('should support deactivation without deletion', () => {
      entity.isActive = false;
      entity.deletedAt = undefined;

      expect(entity.isActive).toBe(false);
      expect(entity.deletedAt).toBeUndefined();
    });
  });

  describe('inheritance', () => {
    it('should allow extending classes to add properties', () => {
      entity.name = 'Test Entity';

      expect(entity.name).toBe('Test Entity');
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('createdAt');
      expect(entity).toHaveProperty('updatedAt');
      expect(entity).toHaveProperty('deletedAt');
      expect(entity).toHaveProperty('isActive');
    });
  });

  describe('extended functionality', () => {
    it('should provide entity info through getEntityInfo method', () => {
      entity.id = 'test-id';
      entity.createdAt = new Date('2023-01-01T10:00:00Z');

      const info = entity.getEntityInfo();
      expect(info).toContain('test-id');
      expect(info).toContain('2023-01-01T10:00:00.000Z');
    });

    it('should check if entity is deleted through isDeleted getter', () => {
      // Entity not deleted
      entity.deletedAt = undefined;
      expect(entity.isDeleted).toBe(false);

      // Entity deleted
      entity.deletedAt = new Date();
      expect(entity.isDeleted).toBe(true);

      // Reset to undefined for null test
      entity.deletedAt = undefined;
      expect(entity.isDeleted).toBe(false);
    });

    it('should check if entity is recent through isRecent getter', () => {
      // No createdAt (default value)
      expect(entity.isRecent).toBe(false);

      // Recent entity (created 1 hour ago)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      entity.createdAt = oneHourAgo;
      expect(entity.isRecent).toBe(true);

      // Old entity (created 2 days ago)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      entity.createdAt = twoDaysAgo;
      expect(entity.isRecent).toBe(false);
    });

    it('should handle edge cases for getters and methods', () => {
      // getEntityInfo with default state
      entity.id = 'test-id';
      expect(() => entity.getEntityInfo()).not.toThrow();

      // Test with a very old date for isRecent edge case
      const veryOldDate = new Date('2020-01-01');
      entity.createdAt = veryOldDate;
      expect(entity.isRecent).toBe(false);
    });

    it('should handle null/undefined cases for getters', () => {
      // Test isDeleted with undefined (should be false)
      entity.deletedAt = undefined;
      expect(entity.isDeleted).toBe(false);

      // Test isRecent with uninitialized createdAt
      const freshEntity = new TestEntity();
      expect(freshEntity.isRecent).toBe(false);

      // Test exact boundary for isRecent (exactly 24 hours ago)
      const exactlyOneDayAgo = new Date();
      exactlyOneDayAgo.setDate(exactlyOneDayAgo.getDate() - 1);
      exactlyOneDayAgo.setHours(exactlyOneDayAgo.getHours() - 1); // Just past 24 hours
      entity.createdAt = exactlyOneDayAgo;
      expect(entity.isRecent).toBe(false);
    });
  });
});
