import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, IsNull } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { User } from '../auth/entities/user.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductSearchDto,
  ProductSortBy,
  SortOrder,
  ProductResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto';
import { CreatedByUserDto } from './dto/product-response.dto';

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
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // ==============================
  // PRODUCT CRUD METHODS (ADMIN ONLY)
  // ==============================

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

    // Verify that all category IDs exist
    const categories = await this.categoryRepository.find({
      where: {
        id: In(createProductDto.categoryIds),
        isActive: true,
        deletedAt: IsNull(),
      },
    });

    if (categories.length !== createProductDto.categoryIds.length) {
      const foundIds = categories.map((cat) => cat.id);
      const missingIds = createProductDto.categoryIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `Categories not found: ${missingIds.join(', ')}`,
      );
    }

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

  // ==============================
  // PUBLIC SEARCH METHODS
  // ==============================

  /**
   * Public search for products (without sensitive user data)
   *
   * This method is designed for unauthenticated/public access and differs from
   * searchProducts() by:
   * - Excluding sensitive user information (createdBy is sanitized)
   * - Only returning active products (isActive = true)
   * - Optimized for public consumption with data sanitization
   * - Uses performance-optimized queries for better public API response times
   *
   * @param searchDto - Search criteria including filters, pagination, and sorting
   * @returns Promise<PaginatedResult<ProductResponseDto>> - Sanitized product results
   * @throws Error - When search operation fails
   */
  async searchProductsPublic(
    searchDto: ProductSearchDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        // No incluir información del usuario creador en búsquedas públicas
        .where('product.deletedAt IS NULL')
        .andWhere('product.isActive = true');

      // Apply filters with optimization hints
      this.applySearchFilters(queryBuilder, searchDto);

      // Apply sorting with index-aware logic
      this.applySorting(queryBuilder, searchDto);

      // Optimization: Use simple COUNT query without complex joins for better performance
      let total: number;
      try {
        const countQueryBuilder = this.productRepository
          .createQueryBuilder('product')
          .where('product.deletedAt IS NULL')
          .andWhere('product.isActive = true');

        // Apply only simple filters for counting (no joins to avoid complexity)
        this.applySimpleFiltersForCount(countQueryBuilder, searchDto);

        // Get total count using optimized query
        total = await countQueryBuilder.getCount();
      } catch (error) {
        // Fallback to basic count if complex query fails
        console.warn(
          'Count query failed, using basic count:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        total = await this.productRepository.count({
          where: { deletedAt: IsNull(), isActive: true },
        });
      }

      // Apply pagination
      const page = searchDto.page || 1;
      const limit = Math.min(searchDto.limit || 20, 100); // Cap at 100 for performance
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      // Execute query
      const products = await queryBuilder.getMany();

      // Transform to DTOs with sanitized data
      const productDtos = products.map((product) => {
        const dto = plainToClass(ProductResponseDto, product, {
          excludeExtraneousValues: true,
        });
        // Asegurar que no hay información del usuario
        dto.createdBy = new CreatedByUserDto();
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
      this.logger.error('Error in searchProductsPublic', {
        error: errorMessage,
        stack: errorStack,
        searchDto,
      });
      throw new Error('Failed to search products: ' + errorMessage);
    }
  }

  /**
   * Admin/authenticated search for products (with full user data)
   */
  async searchProducts(
    searchDto: ProductSearchDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.categories', 'category')
        .leftJoinAndSelect('product.createdBy', 'createdBy')
        .where('product.deletedAt IS NULL')
        .andWhere('product.isActive = true');

      // Apply filters with optimization hints
      this.applySearchFilters(queryBuilder, searchDto);

      // Apply sorting with index-aware logic
      this.applySorting(queryBuilder, searchDto);

      // Optimization: Use simple COUNT query without complex joins for better performance
      let total: number;
      try {
        const countQueryBuilder = this.productRepository
          .createQueryBuilder('product')
          .where('product.deletedAt IS NULL')
          .andWhere('product.isActive = true');

        // Apply only simple filters for counting (no joins to avoid complexity)
        this.applySimpleFiltersForCount(countQueryBuilder, searchDto);

        // Get total count using optimized query
        total = await countQueryBuilder.getCount();
      } catch (error) {
        // Fallback to basic count if complex query fails
        console.warn(
          'Count query failed, using basic count:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        total = await this.productRepository.count({
          where: { deletedAt: IsNull(), isActive: true },
        });
      }

      // Apply pagination
      const page = searchDto.page || 1;
      const limit = Math.min(searchDto.limit || 20, 100); // Cap at 100 for performance
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      // Execute query
      const products = await queryBuilder.getMany();

      // Transform to DTOs
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
    } catch (error) {
      this.logger.error('Error in searchProducts:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        searchDto,
      });

      // For non-critical search failures, return empty result for graceful degradation
      // Critical database errors should still propagate
      if (error instanceof Error && error.message.includes('database')) {
        throw error; // Re-throw critical database errors
      }

      return {
        data: [],
        total: 0,
        page: searchDto.page || 1,
        limit: searchDto.limit || 20,
        totalPages: 0,
      };
    }
  }

  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    searchDto: ProductSearchDto,
  ): void {
    // Optimized text search using our performance indexes
    if (searchDto.search && searchDto.search.trim().length > 0) {
      const searchTerm = searchDto.search.trim();

      // Use different search strategies based on search term characteristics
      if (searchTerm.length >= 3) {
        // For longer terms, use full-text search with GIN index (optimal for word searches)
        queryBuilder.andWhere(
          `(
            to_tsvector('spanish', product.name || ' ' || COALESCE(product.description, '')) 
            @@ plainto_tsquery('spanish', :searchTerm)
            OR product.name % :searchTerm
            OR product.description % :searchTerm
          )`,
          { searchTerm },
        );
      } else {
        // For short terms, use trigram similarity (optimal for partial/fuzzy matching)
        queryBuilder.andWhere(
          '(product.name % :searchTerm OR product.description % :searchTerm)',
          { searchTerm },
        );
      }
    }

    // Optimized category filter using composite indexes
    if (searchDto.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: searchDto.categoryId,
      });
    }

    // Price range filters (leverage idx_products_price_range and composite indexes)
    if (searchDto.minPrice !== undefined && searchDto.maxPrice !== undefined) {
      // Use BETWEEN for range queries to leverage price range index
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

    // Stock filter (leverages idx_products_stock_filter)
    if (searchDto.inStock === true) {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Rating filter (leverages idx_products_rating for better performance)
    // Handle NULL ratings correctly - include products without rating when no filter is applied
    if (searchDto.minRating !== undefined && searchDto.minRating !== null) {
      queryBuilder.andWhere(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        {
          minRating: searchDto.minRating,
        },
      );
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    searchDto: ProductSearchDto,
  ): void {
    const sortBy = searchDto.sortBy || ProductSortBy.CREATED_AT;
    const sortOrder = searchDto.sortOrder || SortOrder.DESC;

    // Optimized sorting using our composite indexes
    switch (sortBy) {
      case ProductSortBy.NAME:
        // Leverages idx_products_name_search
        queryBuilder.orderBy('product.name', sortOrder);
        break;

      case ProductSortBy.PRICE:
        // Leverages idx_products_price_performance
        queryBuilder.orderBy('product.price', sortOrder);
        break;

      case ProductSortBy.RATING:
        // Leverages idx_products_rating_performance with NULLS handling
        if (sortOrder === SortOrder.DESC) {
          queryBuilder.orderBy('product.rating', 'DESC', 'NULLS LAST');
        } else {
          queryBuilder.orderBy('product.rating', 'ASC', 'NULLS FIRST');
        }
        break;

      case ProductSortBy.POPULARITY:
        // Leverages idx_products_popularity_performance
        queryBuilder.orderBy('product.orderCount', sortOrder);
        break;

      case ProductSortBy.VIEWS:
        // Leverages idx_products_views_performance
        queryBuilder.orderBy('product.viewCount', sortOrder);
        break;

      case ProductSortBy.CREATED_AT:
      default:
        // Leverages idx_products_recent_active for recent products
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }

    // Enhanced secondary sorting for consistent results
    // Use composite indexes for better performance
    if (sortBy !== ProductSortBy.CREATED_AT) {
      // Add secondary sort by id for consistency (uses primary key index)
      queryBuilder.addOrderBy('product.id', 'ASC');
    }
  }

  // ==============================
  // CATEGORY CRUD METHODS (ADMIN ONLY)
  // ==============================

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
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

    return plainToClass(CategoryResponseDto, savedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
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

    return plainToClass(CategoryResponseDto, savedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async deleteCategory(id: string): Promise<void> {
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
  }

  async getAllCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { deletedAt: IsNull(), isActive: true },
      order: { name: 'ASC' },
    });

    return categories.map((category) =>
      plainToClass(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
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

  // ==============================
  // OPTIMIZED PRIVATE METHODS
  // ==============================

  /**
   * Optimized search filters for COUNT queries (without relations/joins)
   * This provides better performance for pagination total counts
   */
  private applySearchFiltersForCount(
    queryBuilder: SelectQueryBuilder<Product>,
    searchDto: ProductSearchDto,
  ): void {
    // Optimized text search using our performance indexes
    if (searchDto.search && searchDto.search.trim().length > 0) {
      const searchTerm = searchDto.search.trim();

      if (searchTerm.length >= 3) {
        // Use full-text search with GIN index
        queryBuilder.andWhere(
          `(
            to_tsvector('spanish', product.name || ' ' || COALESCE(product.description, '')) 
            @@ plainto_tsquery('spanish', :searchTerm)
            OR product.name % :searchTerm
            OR product.description % :searchTerm
          )`,
          { searchTerm },
        );
      } else {
        // Use trigram similarity for short terms
        queryBuilder.andWhere(
          '(product.name % :searchTerm OR product.description % :searchTerm)',
          { searchTerm },
        );
      }
    }

    // For category filter in count query, we need to join
    if (searchDto.categoryId) {
      queryBuilder
        .leftJoin('product.categories', 'category')
        .andWhere('category.id = :categoryId', {
          categoryId: searchDto.categoryId,
        });
    }

    // Price range filters
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

    // Stock filter
    if (searchDto.inStock === true) {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Rating filter - Handle NULL ratings correctly
    if (searchDto.minRating !== undefined && searchDto.minRating !== null) {
      queryBuilder.andWhere(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        {
          minRating: searchDto.minRating,
        },
      );
    }
  }

  // ==============================
  // PUBLIC METHODS
  // ==============================

  /**
   * Get all products with pagination and filtering
   * High-performance endpoint with optimized query building
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
   * High-performance product search for popular/trending products
   * Leverages idx_products_popularity_performance and idx_products_views_performance
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
   * High-performance search for recently added products
   * Leverages idx_products_recent_active composite index
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
   * High-performance search for products by category with optimal index usage
   * Leverages idx_product_categories_category_performance
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
   * Get product by slug (public access - without sensitive user data)
   */
  async getProductBySlugPublic(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { slug, deletedAt: IsNull(), isActive: true },
      relations: ['categories'], // No incluir createdBy
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

    // Asegurar que no hay información del usuario
    dto.createdBy = new CreatedByUserDto();

    return dto;
  }

  /**
   * Optimized slug-based product lookup (admin/authenticated access - with full user data)
   * Leverages unique idx_products_slug_unique index
   */
  async getProductBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { slug, deletedAt: IsNull(), isActive: true },
      relations: ['categories', 'createdBy'],
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

    return plainToClass(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Simple filters for count queries (no joins, no complex operations)
   * This ensures getCount() works correctly
   */
  private applySimpleFiltersForCount(
    queryBuilder: SelectQueryBuilder<Product>,
    searchDto: ProductSearchDto,
  ): void {
    // Only apply simple filters that don't require joins

    // Price range filters
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

    // Stock filter
    if (searchDto.inStock === true) {
      queryBuilder.andWhere('product.stock > 0');
    }

    // Rating filter - Handle NULL ratings correctly
    if (searchDto.minRating !== undefined && searchDto.minRating !== null) {
      queryBuilder.andWhere(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        {
          minRating: searchDto.minRating,
        },
      );
    }

    // Simple text search on product fields only (no joins)
    if (searchDto.search && searchDto.search.trim().length > 0) {
      const searchTerm = `%${searchDto.search.trim()}%`;
      queryBuilder.andWhere(
        '(product.name ILIKE :searchTerm OR product.description ILIKE :searchTerm)',
        { searchTerm },
      );
    }
  }
}
