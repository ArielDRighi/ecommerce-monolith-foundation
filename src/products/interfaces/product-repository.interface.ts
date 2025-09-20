import {
  SelectQueryBuilder,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
} from 'typeorm';
import { Product } from '../entities/product.entity';

/**
 * Interface for Product Repository
 * Abstracts database operations for products
 */
export interface IProductRepository {
  /**
   * Create a new product instance (not saved to DB yet)
   */
  create(productData: Partial<Product>): Product;

  /**
   * Save a product entity to the database
   */
  save(product: Product): Promise<Product>;

  /**
   * Find a single product by options
   */
  findOne(options: FindOneOptions<Product>): Promise<Product | null>;

  /**
   * Find multiple products by options
   */
  find(options?: FindManyOptions<Product>): Promise<Product[]>;

  /**
   * Count products by options
   */
  count(options?: FindManyOptions<Product>): Promise<number>;

  /**
   * Soft delete a product by ID
   */
  softDelete(id: string): Promise<void>;

  /**
   * Increment a numeric field atomically
   */
  increment(
    criteria: FindOptionsWhere<Product>,
    propertyPath: string,
    value: number,
  ): Promise<void>;

  /**
   * Create a query builder for complex queries
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<Product>;
}
