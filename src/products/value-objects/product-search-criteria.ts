import { SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import {
  ProductSearchDto,
  ProductSortBy,
  SortOrder,
} from '../dto/product-search.dto';

/**
 * Value Object that encapsulates complex product search logic
 * Following DDD patterns for better maintainability and testability
 */
export class ProductSearchCriteria {
  constructor(private readonly filters: ProductSearchDto) {}

  /**
   * Main method that applies all filters and sorting to the query builder
   */
  buildQueryBuilder(
    queryBuilder: SelectQueryBuilder<Product>,
  ): SelectQueryBuilder<Product> {
    this.applyBasicFilters(queryBuilder);
    this.applySearchFilters(queryBuilder);
    this.applyCategoryFilter(queryBuilder);
    this.applyPriceFilters(queryBuilder);
    this.applyStockFilters(queryBuilder);
    this.applyRatingFilters(queryBuilder);
    this.applySorting(queryBuilder);

    return queryBuilder;
  } /**
   * Build a simplified query builder for count operations
   * Only applies filters that don't require joins for better performance
   */
  buildCountQueryBuilder(
    queryBuilder: SelectQueryBuilder<Product>,
  ): SelectQueryBuilder<Product> {
    this.applyBasicFilters(queryBuilder);
    this.applySimpleFilters(queryBuilder);

    return queryBuilder;
  }

  /**
   * Apply basic filters that are always present
   */
  private applyBasicFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    queryBuilder
      .where('product.deletedAt IS NULL')
      .andWhere('product.isActive = true');
  }

  /**
   * Apply text search filters with full-text search optimization
   */
  private applySearchFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    if (!this.filters.search || this.filters.search.trim().length === 0) {
      return;
    }

    const searchTerm = this.filters.search.trim();

    if (searchTerm.length >= 3) {
      // Use PostgreSQL full-text search for longer terms
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
      // Use similarity search for shorter terms
      queryBuilder.andWhere(
        '(product.name % :searchTerm OR product.description % :searchTerm)',
        { searchTerm },
      );
    }
  }

  /**
   * Apply category filter
   */
  private applyCategoryFilter(queryBuilder: SelectQueryBuilder<Product>): void {
    if (this.filters.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: this.filters.categoryId,
      });
    }
  }

  /**
   * Apply price range filters
   */
  private applyPriceFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    const { minPrice, maxPrice } = this.filters;

    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else {
      if (minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
      }
      if (maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
      }
    }
  }

  /**
   * Apply stock availability filters
   */
  private applyStockFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    if (this.filters.inStock === true) {
      queryBuilder.andWhere('product.stock > 0');
    }
  }

  /**
   * Apply rating filters
   */
  private applyRatingFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    if (
      this.filters.minRating !== undefined &&
      this.filters.minRating !== null
    ) {
      queryBuilder.andWhere(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        { minRating: this.filters.minRating },
      );
    }
  }

  /**
   * Apply sorting with optimized index usage
   */
  private applySorting(queryBuilder: SelectQueryBuilder<Product>): void {
    const sortBy = this.filters.sortBy || ProductSortBy.CREATED_AT;
    const sortOrder = this.filters.sortOrder || SortOrder.DESC;

    // Optimized sorting using composite indexes
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
    if (sortBy !== ProductSortBy.CREATED_AT) {
      // Add secondary sort by id for consistency (uses primary key index)
      queryBuilder.addOrderBy('product.id', 'ASC');
    }
  }

  /**
   * Apply simplified filters for count queries (no joins needed)
   */
  private applySimpleFilters(queryBuilder: SelectQueryBuilder<Product>): void {
    // Text search (simplified for count)
    if (this.filters.search && this.filters.search.trim().length > 0) {
      const searchTerm = this.filters.search.trim();
      queryBuilder.andWhere(
        '(product.name ILIKE :searchPattern OR product.description ILIKE :searchPattern)',
        { searchPattern: `%${searchTerm}%` },
      );
    }

    // Price filters
    this.applyPriceFilters(queryBuilder);

    // Stock filter
    this.applyStockFilters(queryBuilder);

    // Rating filter
    this.applyRatingFilters(queryBuilder);

    // Note: Category filter requires join, so it's excluded from count query
    // The count might be slightly higher than actual results, but it's acceptable for performance
  }

  /**
   * Get pagination parameters
   */
  getPaginationParams(): { page: number; limit: number; skip: number } {
    const page = this.filters.page || 1;
    const limit = Math.min(this.filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Check if this search criteria requires joins (for optimization)
   */
  requiresJoins(): boolean {
    return !!this.filters.categoryId;
  }

  /**
   * Get a cache key for this search criteria
   */
  getCacheKey(): string {
    const keyParams = {
      search: this.filters.search,
      categoryId: this.filters.categoryId,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice,
      inStock: this.filters.inStock,
      minRating: this.filters.minRating,
      sortBy: this.filters.sortBy,
      sortOrder: this.filters.sortOrder,
      page: this.filters.page,
      limit: this.filters.limit,
    };

    return `product_search:${Buffer.from(JSON.stringify(keyParams)).toString('base64')}`;
  }
}
