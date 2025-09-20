import { FindOneOptions, FindManyOptions } from 'typeorm';
import { Category } from '../entities/category.entity';

/**
 * Interface for Category Repository
 * Abstracts database operations for categories
 */
export interface ICategoryRepository {
  /**
   * Create a new category instance (not saved to DB yet)
   */
  create(categoryData: Partial<Category>): Category;

  /**
   * Save a category entity to the database
   */
  save(category: Category): Promise<Category>;

  /**
   * Find a single category by options
   */
  findOne(options: FindOneOptions<Category>): Promise<Category | null>;

  /**
   * Find multiple categories by options
   */
  find(options?: FindManyOptions<Category>): Promise<Category[]>;

  /**
   * Count categories by options
   */
  count(options?: FindManyOptions<Category>): Promise<number>;

  /**
   * Soft delete a category by ID
   */
  softDelete(id: string): Promise<void>;
}
