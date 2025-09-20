import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
} from 'typeorm';
import { Product } from '../entities/product.entity';
import { IProductRepository } from '../interfaces/product-repository.interface';

/**
 * TypeORM implementation of Product Repository
 * Encapsulates all database operations for products
 */
@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  create(productData: Partial<Product>): Product {
    return this.repository.create(productData);
  }

  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }

  async findOne(options: FindOneOptions<Product>): Promise<Product | null> {
    return this.repository.findOne(options);
  }

  async find(options?: FindManyOptions<Product>): Promise<Product[]> {
    return this.repository.find(options);
  }

  async count(options?: FindManyOptions<Product>): Promise<number> {
    return this.repository.count(options);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async increment(
    criteria: FindOptionsWhere<Product>,
    propertyPath: string,
    value: number,
  ): Promise<void> {
    await this.repository.increment(criteria, propertyPath, value);
  }

  createQueryBuilder(alias?: string): SelectQueryBuilder<Product> {
    return this.repository.createQueryBuilder(alias);
  }
}
