import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ICategoryRepository } from '../interfaces/category-repository.interface';

/**
 * TypeORM implementation of Category Repository
 * Encapsulates all database operations for categories
 */
@Injectable()
export class TypeOrmCategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  create(categoryData: Partial<Category>): Category {
    return this.repository.create(categoryData);
  }

  async save(category: Category): Promise<Category> {
    return this.repository.save(category);
  }

  async findOne(options: FindOneOptions<Category>): Promise<Category | null> {
    return this.repository.findOne(options);
  }

  async find(options?: FindManyOptions<Category>): Promise<Category[]> {
    return this.repository.find(options);
  }

  async count(options?: FindManyOptions<Category>): Promise<number> {
    return this.repository.count(options);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
