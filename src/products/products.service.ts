import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { SelectQueryBuilder, IsNull } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Product } from './entities/product.entity';
import { User } from '../auth/entities/user.entity';
import { ProductSearchCriteria } from './value-objects/product-search-criteria';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductSearchDto,
  ProductResponseDto,
} from './dto';
import { CreatedByUserDto } from './dto/product-response.dto';
import { CategoriesService } from '../categories/categories.service';
import { IProductRepository } from './interfaces/product-repository.interface';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  // #region PRODUCT CRUD METHODS (ADMIN ONLY)

  async createProduct(
    createProductDto: CreateProductDto,
    createdBy: User,
  ): Promise<ProductResponseDto> {
    // Check if slug already exists
    const existingProduct = await this.productRepository.findOne({
      where: { slug: createProductDto.slug, deletedAt: IsNull() },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with slug '${createProductDto.slug}' already exists`,
      );
    }

    // Verify that all category IDs exist using CategoriesService
    const categories = await this.categoriesService.validateCategoryIds(
      createProductDto.categoryIds,
    );

    // Create product (categoryIds is handled separately via categories relation)
    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      slug: createProductDto.slug,
      price: createProductDto.price,
      stock: createProductDto.stock,
      sku: createProductDto.sku,
      images: createProductDto.images,
      attributes: createProductDto.attributes,
      isActive: createProductDto.isActive,
      createdBy,
      createdById: createdBy.id,
      categories,
    });

    const savedProduct = await this.productRepository.save(product);

    // Fetch with relations for response
    const productWithRelations = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['categories', 'createdBy'],
    });

    return plainToClass(ProductResponseDto, productWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['categories', 'createdBy'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if slug conflicts with another product
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug, deletedAt: IsNull() },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(
          `Product with slug '${updateProductDto.slug}' already exists`,
        );
      }
    }

    // Update product fields explicitly for safety
    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
    }
    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }
    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }
    if (updateProductDto.slug !== undefined) {
      product.slug = updateProductDto.slug;
    }
    if (updateProductDto.stock !== undefined) {
      product.stock = updateProductDto.stock;
    }
    if (updateProductDto.sku !== undefined) {
      product.sku = updateProductDto.sku;
    }
    if (updateProductDto.images !== undefined) {
      product.images = updateProductDto.images;
    }
    if (updateProductDto.attributes !== undefined) {
      product.attributes = updateProductDto.attributes;
    }
    if (updateProductDto.isActive !== undefined) {
      product.isActive = updateProductDto.isActive;
    }

    const savedProduct = await this.productRepository.save(product);

    // Fetch updated product with relations
    const updatedProduct = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['categories', 'createdBy'],
    });

    return plainToClass(ProductResponseDto, updatedProduct, {
      excludeExtraneousValues: true,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete using TypeORM's built-in soft delete
    await this.productRepository.softDelete(id);
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull(), isActive: true },
      relations: ['categories', 'createdBy'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count (fire and forget, atomic)
    this.productRepository.increment({ id }, 'viewCount', 1).catch(() => {
      // Silent fail for view count increment
    });

    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  // #region PUBLIC SEARCH METHODS

  /**
   * Base search method with optional user data inclusion
   */
  private async searchProductsBase(
    searchDto: ProductSearchDto,
    includeUserData: boolean = true,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    try {
      const searchCriteria = new ProductSearchCriteria(searchDto);

      // Build main query with joins if needed
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category');

      if (includeUserData) {
        queryBuilder.leftJoinAndSelect('product.createdBy', 'createdBy');
      }

      // Apply all search criteria using Value Object
      searchCriteria.buildQueryBuilder(queryBuilder);

      // Get total count using optimized count query
      let total: number;
      try {
        const countQueryBuilder =
          this.productRepository.createQueryBuilder('product');

        // Use simplified criteria for count (no joins for performance)
        searchCriteria.buildCountQueryBuilder(countQueryBuilder);
        total = await countQueryBuilder.getCount();
      } catch (error) {
        console.warn(
          'Count query failed, using basic count:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        total = await this.productRepository.count({
          where: { deletedAt: IsNull(), isActive: true },
        });
      }

      // Apply pagination using Value Object
      const { page, limit, skip } = searchCriteria.getPaginationParams();
      queryBuilder.skip(skip).take(limit);

      const products = await queryBuilder.getMany();
      const productDtos = products.map((product) => {
        const dto = plainToClass(ProductResponseDto, product, {
          excludeExtraneousValues: true,
        });

        // Sanitize user data for public access
        if (!includeUserData) {
          dto.createdBy = new CreatedByUserDto();
        }

        return dto;
      });

      return {
        data: productDtos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error in product search', {
        error: errorMessage,
        stack: errorStack,
        searchDto,
      });
      throw new Error('Failed to search products: ' + errorMessage);
    }
  }

  /**
   * Public search for products (without sensitive user data)
   */
  async searchProductsPublic(
    searchDto: ProductSearchDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.searchProductsBase(searchDto, false);
  }

  /**
   * Admin/authenticated search for products (with full user data)
   */
  async searchProducts(
    searchDto: ProductSearchDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.searchProductsBase(searchDto, true);
  }

  private applyPriceFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    searchDto: ProductSearchDto,
  ): void {
    if (searchDto.minPrice !== undefined && searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: searchDto.minPrice,
        maxPrice: searchDto.maxPrice,
      });
    } else {
      if (searchDto.minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: searchDto.minPrice,
        });
      }
      if (searchDto.maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: searchDto.maxPrice,
        });
      }
    }
  }

  // #region OPTIMIZED PRIVATE METHODS

  // #region PUBLIC METHODS

  /**
   * Get all products with pagination and filtering
   */
  async getAllProducts(options: {
    page: number;
    limit: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit, category, minPrice, maxPrice } = options;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true');

    // Category filter
    if (category) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: category,
      });
    }

    // Price filters
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Get paginated results
    const products = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: products.map((product) =>
        plainToClass(ProductResponseDto, product, {
          excludeExtraneousValues: true,
        }),
      ),
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get popular products by order and view count
   */
  async getPopularProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true')
      .andWhere('product.orderCount > 0') // Use index condition
      .orderBy('product.orderCount', 'DESC')
      .addOrderBy('product.viewCount', 'DESC')
      .limit(Math.min(limit, 50)) // Cap for performance
      .getMany();

    return products.map((product) =>
      plainToClass(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get recently added products
   */
  async getRecentProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true')
      .orderBy('product.createdAt', 'DESC')
      .limit(Math.min(limit, 50))
      .getMany();

    return products.map((product) =>
      plainToClass(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Get products by category with pagination
   */
  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true')
      .andWhere('category.id = :categoryId', { categoryId })
      .orderBy('product.createdAt', 'DESC');

    // Get total count with optimized query
    const total = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.categories', 'category')
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true')
      .andWhere('category.id = :categoryId', { categoryId })
      .getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(Math.min(limit, 100));

    const products = await queryBuilder.getMany();

    const productDtos = products.map((product) =>
      plainToClass(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      data: productDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product by slug with optional user data
   */
  async getProductBySlug(
    slug: string,
    includeUserData: boolean = true,
  ): Promise<ProductResponseDto> {
    const relations = includeUserData
      ? ['categories', 'createdBy']
      : ['categories'];

    const product = await this.productRepository.findOne({
      where: { slug, deletedAt: IsNull(), isActive: true },
      relations,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    // Increment view count (fire and forget, atomic)
    this.productRepository
      .increment({ id: product.id }, 'viewCount', 1)
      .catch(() => {
        // Silent fail for view count increment
      });

    const dto = plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    // Sanitize user data for public access
    if (!includeUserData) {
      dto.createdBy = new CreatedByUserDto();
    }

    return dto;
  }

  /**
   * Public access wrapper for getProductBySlug
   */
  async getProductBySlugPublic(slug: string): Promise<ProductResponseDto> {
    return this.getProductBySlug(slug, false);
  }
}
