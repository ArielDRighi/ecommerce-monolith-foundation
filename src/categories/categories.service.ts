import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // #region CATEGORY CRUD METHODS (ADMIN ONLY)

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Creating category with slug: ${createCategoryDto.slug}`);

    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug: createCategoryDto.slug, deletedAt: IsNull() },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with slug '${createCategoryDto.slug}' already exists`,
      );
    }

    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);

    this.logger.log(
      `Category created successfully with ID: ${savedCategory.id}`,
    );
    return plainToClass(CategoryResponseDto, savedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Updating category with ID: ${id}`);

    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if slug conflicts with another category
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug, deletedAt: IsNull() },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category with slug '${updateCategoryDto.slug}' already exists`,
        );
      }
    }

    // Update category fields explicitly for safety
    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.slug !== undefined) {
      category.slug = updateCategoryDto.slug;
    }
    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }
    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;
    }

    const savedCategory = await this.categoryRepository.save(category);

    this.logger.log(
      `Category updated successfully with ID: ${savedCategory.id}`,
    );
    return plainToClass(CategoryResponseDto, savedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    this.logger.log(`Deleting category with ID: ${id}`);

    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has products
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete category that contains products. Remove products first.',
      );
    }

    // Soft delete using TypeORM's built-in soft delete
    await this.categoryRepository.softDelete(id);

    this.logger.log(`Category soft deleted successfully with ID: ${id}`);
  }

  async getAllCategories(): Promise<CategoryResponseDto[]> {
    this.logger.log('Fetching all active categories');

    const categories = await this.categoryRepository.find({
      where: { deletedAt: IsNull(), isActive: true },
      order: { name: 'ASC' },
    });

    this.logger.log(`Found ${categories.length} active categories`);
    return categories.map((category) =>
      plainToClass(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    this.logger.log(`Fetching category with ID: ${id}`);

    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull(), isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return plainToClass(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  // #region VALIDATION AND UTILITY METHODS

  /**
   * Validates that all provided category IDs exist and are active
   * Used by ProductsService for validation during product creation/update
   */
  async validateCategoryIds(categoryIds: string[]): Promise<Category[]> {
    this.logger.log(`Validating ${categoryIds.length} category IDs`);

    if (!categoryIds || categoryIds.length === 0) {
      return [];
    }

    const categories = await this.categoryRepository.find({
      where: {
        id: In(categoryIds),
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (categories.length !== categoryIds.length) {
      const foundIds = categories.map((category) => category.id);
      const missingIds = categoryIds.filter((id) => !foundIds.includes(id));

      throw new BadRequestException(
        `Categories not found or inactive: ${missingIds.join(', ')}`,
      );
    }

    this.logger.log(
      `All ${categoryIds.length} category IDs validated successfully`,
    );
    return categories;
  }

  /**
   * Checks if a category exists by ID
   * Lighter method for simple existence checks
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.categoryRepository.count({
      where: { id, deletedAt: IsNull(), isActive: true },
    });
    return count > 0;
  }

  /**
   * Gets categories by IDs (used for product-category relationships)
   */
  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.categoryRepository.find({
      where: {
        id: In(ids),
        deletedAt: IsNull(),
        isActive: true,
      },
    });
  }

  // #endregion
}
