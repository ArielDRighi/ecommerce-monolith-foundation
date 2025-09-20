/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ProductSearchCriteria } from './product-search-criteria';
import {
  ProductSearchDto,
  ProductSortBy,
  SortOrder,
} from '../dto/product-search.dto';

describe('ProductSearchCriteria', () => {
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Create a comprehensive mock of SelectQueryBuilder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    };
  });

  describe('buildQueryBuilder', () => {
    it('should apply basic filters for all searches', () => {
      const searchDto: ProductSearchDto = {};
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = true',
      );
    });

    it('should apply text search filter with full-text search for long terms', () => {
      const searchDto: ProductSearchDto = { search: 'macbook pro laptop' };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('to_tsvector'),
        { searchTerm: 'macbook pro laptop' },
      );
    });

    it('should apply text search filter with similarity search for short terms', () => {
      const searchDto: ProductSearchDto = { search: 'hp' };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name % :searchTerm OR product.description % :searchTerm)',
        { searchTerm: 'hp' },
      );
    });

    it('should apply category filter when categoryId is provided', () => {
      const categoryId = '902eaa28-87c4-4722-a7dd-dcbf8800aa31';
      const searchDto: ProductSearchDto = { categoryId };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId },
      );
    });

    it('should apply price range filter when both min and max prices are provided', () => {
      const searchDto: ProductSearchDto = { minPrice: 100, maxPrice: 500 };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price BETWEEN :minPrice AND :maxPrice',
        { minPrice: 100, maxPrice: 500 },
      );
    });

    it('should apply separate price filters when only one price bound is provided', () => {
      const searchDto: ProductSearchDto = { minPrice: 100 };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 100 },
      );
    });

    it('should apply stock filter when inStock is true', () => {
      const searchDto: ProductSearchDto = { inStock: true };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.stock > 0',
      );
    });

    it('should apply rating filter when minRating is provided', () => {
      const searchDto: ProductSearchDto = { minRating: 4.0 };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        { minRating: 4.0 },
      );
    });

    it('should apply default sorting (CREATED_AT DESC) when no sort parameters provided', () => {
      const searchDto: ProductSearchDto = {};
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.createdAt',
        SortOrder.DESC,
      );
    });

    it('should apply custom sorting when sort parameters are provided', () => {
      const searchDto: ProductSearchDto = {
        sortBy: ProductSortBy.PRICE,
        sortOrder: SortOrder.ASC,
      };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.price',
        SortOrder.ASC,
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'product.id',
        'ASC',
      );
    });

    it('should handle rating sort with proper NULLS handling for DESC order', () => {
      const searchDto: ProductSearchDto = {
        sortBy: ProductSortBy.RATING,
        sortOrder: SortOrder.DESC,
      };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.rating',
        'DESC',
        'NULLS LAST',
      );
    });

    it('should handle rating sort with proper NULLS handling for ASC order', () => {
      const searchDto: ProductSearchDto = {
        sortBy: ProductSortBy.RATING,
        sortOrder: SortOrder.ASC,
      };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.rating',
        'ASC',
        'NULLS FIRST',
      );
    });
  });

  describe('buildCountQueryBuilder', () => {
    it('should apply basic filters and simplified search without joins', () => {
      const searchDto: ProductSearchDto = {
        search: 'test',
        categoryId: '902eaa28-87c4-4722-a7dd-dcbf8800aa31',
        minPrice: 100,
      };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildCountQueryBuilder(mockQueryBuilder);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = true',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :searchPattern OR product.description ILIKE :searchPattern)',
        { searchPattern: '%test%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 100 },
      );
      // Category filter should not be applied in count query
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'category.id = :categoryId',
        expect.any(Object),
      );
    });
  });

  describe('getPaginationParams', () => {
    it('should return default pagination when no parameters provided', () => {
      const searchDto: ProductSearchDto = {};
      const criteria = new ProductSearchCriteria(searchDto);

      const result = criteria.getPaginationParams();

      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('should calculate pagination correctly for custom parameters', () => {
      const searchDto: ProductSearchDto = { page: 3, limit: 15 };
      const criteria = new ProductSearchCriteria(searchDto);

      const result = criteria.getPaginationParams();

      expect(result).toEqual({
        page: 3,
        limit: 15,
        skip: 30, // (3-1) * 15
      });
    });

    it('should cap limit to maximum of 100', () => {
      const searchDto: ProductSearchDto = { limit: 500 };
      const criteria = new ProductSearchCriteria(searchDto);

      const result = criteria.getPaginationParams();

      expect(result.limit).toBe(100);
    });
  });

  describe('requiresJoins', () => {
    it('should return true when category filter is present', () => {
      const searchDto: ProductSearchDto = {
        categoryId: '902eaa28-87c4-4722-a7dd-dcbf8800aa31',
      };
      const criteria = new ProductSearchCriteria(searchDto);

      expect(criteria.requiresJoins()).toBe(true);
    });

    it('should return false when no category filter is present', () => {
      const searchDto: ProductSearchDto = { search: 'test', minPrice: 100 };
      const criteria = new ProductSearchCriteria(searchDto);

      expect(criteria.requiresJoins()).toBe(false);
    });
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys for identical search criteria', () => {
      const searchDto: ProductSearchDto = {
        search: 'macbook',
        categoryId: '902eaa28-87c4-4722-a7dd-dcbf8800aa31',
        minPrice: 500,
        maxPrice: 2000,
        page: 1,
        limit: 20,
      };

      const criteria1 = new ProductSearchCriteria(searchDto);
      const criteria2 = new ProductSearchCriteria(searchDto);

      expect(criteria1.getCacheKey()).toBe(criteria2.getCacheKey());
    });

    it('should generate different cache keys for different search criteria', () => {
      const searchDto1: ProductSearchDto = { search: 'macbook', page: 1 };
      const searchDto2: ProductSearchDto = { search: 'macbook', page: 2 };

      const criteria1 = new ProductSearchCriteria(searchDto1);
      const criteria2 = new ProductSearchCriteria(searchDto2);

      expect(criteria1.getCacheKey()).not.toBe(criteria2.getCacheKey());
    });

    it('should include product_search prefix in cache key', () => {
      const searchDto: ProductSearchDto = { search: 'test' };
      const criteria = new ProductSearchCriteria(searchDto);

      const cacheKey = criteria.getCacheKey();

      expect(cacheKey).toMatch(/^product_search:/);
    });
  });

  describe('complex search scenarios', () => {
    it('should handle comprehensive search with all filters', () => {
      const searchDto: ProductSearchDto = {
        search: 'macbook pro',
        categoryId: '902eaa28-87c4-4722-a7dd-dcbf8800aa31',
        minPrice: 1000,
        maxPrice: 3000,
        inStock: true,
        minRating: 4.5,
        sortBy: ProductSortBy.POPULARITY,
        sortOrder: SortOrder.DESC,
        page: 2,
        limit: 15,
      };
      const criteria = new ProductSearchCriteria(searchDto);

      criteria.buildQueryBuilder(mockQueryBuilder);

      // Verify all filters are applied
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = true',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('to_tsvector'),
        { searchTerm: 'macbook pro' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: '902eaa28-87c4-4722-a7dd-dcbf8800aa31' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price BETWEEN :minPrice AND :maxPrice',
        { minPrice: 1000, maxPrice: 3000 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.stock > 0',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        { minRating: 4.5 },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.orderCount',
        SortOrder.DESC,
      );
    });

    it('should handle empty search gracefully', () => {
      const searchDto: ProductSearchDto = {};
      const criteria = new ProductSearchCriteria(searchDto);

      expect(() => criteria.buildQueryBuilder(mockQueryBuilder)).not.toThrow();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = true',
      );
    });
  });
});
