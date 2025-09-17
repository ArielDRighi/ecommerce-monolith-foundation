import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { ProductsService } from '../products/products.service';
import { Logger } from '@nestjs/common';

// Mock ProductsService
const mockProductsService = {
  searchProducts: jest.fn(),
  findAll: jest.fn(),
  findByCategory: jest.fn(),
  findOne: jest.fn(),
  findPopular: jest.fn(),
  findRecent: jest.fn(),
  getBulkProductDetails: jest.fn(),
  findRelatedProducts: jest.fn(),
  getPopularProducts: jest.fn(),
  getRecentProducts: jest.fn(),
  getProductsByCategory: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);

    // Mock Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return system health dashboard', () => {
      const result = controller.getDashboard();

      expect(result).toBeDefined();
      expect(result.status).toBe('Excellent');
      expect(result.avgResponseTime).toBe('45ms');
      expect(result.optimizationLevel).toBe('Enterprise-grade');
      expect(result.activeIndexes).toBe(29);
      expect(result.lastOptimization).toBe('2025-09-16');
      expect(result.scalabilityRating).toContain('5000+ products');
    });

    it('should return correct structure', () => {
      const result = controller.getDashboard();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('optimizationLevel');
      expect(result).toHaveProperty('activeIndexes');
      expect(result).toHaveProperty('lastOptimization');
      expect(result).toHaveProperty('scalabilityRating');
    });
  });

  describe('getOptimizationResults', () => {
    it('should return optimization results with improvements', () => {
      const result = controller.getOptimizationResults();

      expect(result).toBeDefined();
      expect(result.summary).toContain('80%+ performance improvements');
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.techniques).toBeInstanceOf(Array);
      expect(result.scalability).toBeDefined();
      expect(result.businessImpact).toBeDefined();
    });

    it('should include specific optimization metrics', () => {
      const result = controller.getOptimizationResults();
      const firstImprovement = result.improvements[0];

      expect(firstImprovement).toHaveProperty('operation');
      expect(firstImprovement).toHaveProperty('beforeOptimization');
      expect(firstImprovement).toHaveProperty('afterOptimization');
      expect(firstImprovement).toHaveProperty('improvement');
      expect(firstImprovement).toHaveProperty('technique');
    });

    it('should show Product Search optimization', () => {
      const result = controller.getOptimizationResults();
      const searchOptimization = result.improvements.find(
        (improvement) =>
          improvement.operation === 'Product Search with Filters',
      );

      expect(searchOptimization).toBeDefined();
      expect(searchOptimization?.beforeOptimization).toBe('450-800ms');
      expect(searchOptimization?.afterOptimization).toBe('89ms');
      expect(searchOptimization?.improvement).toContain('80-87%');
    });
  });

  describe('benchmarkSearch', () => {
    it('should return search benchmark with mock data', async () => {
      const mockSearchResult = {
        data: [{ id: 1, title: 'Test Product', category: 'Electronics' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      const result = await controller.benchmarkSearch('test');

      expect(result).toBeDefined();
      expect(result.operation).toContain('Search');
      expect(result.executionTime).toBeDefined();
      expect(result.resultCount).toBe(1);
      expect(result.timestamp).toBeDefined();
      expect(result.performanceRating).toBeDefined();
      expect(mockProductsService.searchProducts).toHaveBeenCalledWith({
        search: 'test',
        categoryId: undefined,
        minPrice: 100,
        maxPrice: 1000,
        page: 1,
        limit: 20,
      });
    });

    it('should use default search term when none provided', async () => {
      const mockSearchResult = {
        data: [{ id: 1, title: 'Samsung Phone' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      await controller.benchmarkSearch();

      expect(mockProductsService.searchProducts).toHaveBeenCalledWith({
        search: 'Samsung',
        categoryId: undefined,
        minPrice: 100,
        maxPrice: 1000,
        page: 1,
        limit: 20,
      });
    });

    it('should use all provided search parameters', async () => {
      const mockSearchResult = {
        data: [{ id: 1, title: 'Product in category' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      await controller.benchmarkSearch('laptop', 'electronics', 500, 2000);

      expect(mockProductsService.searchProducts).toHaveBeenCalledWith({
        search: 'laptop',
        categoryId: 'electronics',
        minPrice: 500,
        maxPrice: 2000,
        page: 1,
        limit: 20,
      });
    });

    it('should return Excellent performance rating for fast execution', async () => {
      const mockSearchResult = { data: [], total: 0, page: 1, totalPages: 1 };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      // Mock performance.now to simulate fast execution (< 50ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1025); // 25ms difference

      const result = await controller.benchmarkSearch('test');

      expect(result.performanceRating).toBe('Excellent');
      expect(result.executionTime).toBe(25);
    });

    it('should return Good performance rating for medium execution', async () => {
      const mockSearchResult = { data: [], total: 0, page: 1, totalPages: 1 };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      // Mock performance.now to simulate medium execution (75ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1075); // 75ms difference

      const result = await controller.benchmarkSearch('test');

      expect(result.performanceRating).toBe('Good');
      expect(result.executionTime).toBe(75);
    });

    it('should return Needs Improvement rating for slow execution', async () => {
      const mockSearchResult = { data: [], total: 0, page: 1, totalPages: 1 };
      mockProductsService.searchProducts.mockResolvedValue(mockSearchResult);

      // Mock performance.now to simulate slow execution (150ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1150); // 150ms difference

      const result = await controller.benchmarkSearch('test');

      expect(result.performanceRating).toBe('Needs Improvement');
      expect(result.executionTime).toBe(150);
    });

    it('should handle search errors gracefully', async () => {
      mockProductsService.searchProducts.mockRejectedValue(
        new Error('Search failed'),
      );

      const result = await controller.benchmarkSearch('test');

      expect(result).toBeDefined();
      expect(result.operation).toContain('failed');
      expect(result.resultCount).toBe(0);
      expect(result.performanceRating).toBe('Needs Improvement');
    });

    it('should handle non-Error exceptions', async () => {
      mockProductsService.searchProducts.mockRejectedValue('String error');

      const result = await controller.benchmarkSearch('test');

      expect(result.operation).toContain('failed');
      expect(result.performanceRating).toBe('Needs Improvement');
    });
  });

  describe('benchmarkPopular', () => {
    it('should return popular products benchmark', async () => {
      const mockPopularProducts = [
        { id: 1, title: 'Popular Product', category: 'Electronics' },
        { id: 2, title: 'Another Popular', category: 'Clothing' },
      ];
      mockProductsService.getPopularProducts.mockResolvedValue(
        mockPopularProducts,
      );

      const result = await controller.benchmarkPopular();

      expect(result).toBeDefined();
      expect(result.operation).toBe('Popular Products Listing');
      expect(result.executionTime).toBeDefined();
      expect(result.resultCount).toBe(2);
      expect(result.performanceRating).toBeDefined();
      expect(mockProductsService.getPopularProducts).toHaveBeenCalledWith(20);
    });

    it('should return Excellent rating for very fast execution', async () => {
      const mockPopularProducts = [{ id: 1, title: 'Popular Product' }];
      mockProductsService.getPopularProducts.mockResolvedValue(
        mockPopularProducts,
      );

      // Mock performance.now to simulate very fast execution (< 30ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1020); // 20ms difference

      const result = await controller.benchmarkPopular();

      expect(result.performanceRating).toBe('Excellent');
      expect(result.executionTime).toBe(20);
    });

    it('should return Good rating for medium execution', async () => {
      const mockPopularProducts = [{ id: 1, title: 'Popular Product' }];
      mockProductsService.getPopularProducts.mockResolvedValue(
        mockPopularProducts,
      );

      // Mock performance.now to simulate medium execution (45ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1045); // 45ms difference

      const result = await controller.benchmarkPopular();

      expect(result.performanceRating).toBe('Good');
      expect(result.executionTime).toBe(45);
    });

    it('should return Needs Improvement rating for slow execution', async () => {
      const mockPopularProducts = [{ id: 1, title: 'Popular Product' }];
      mockProductsService.getPopularProducts.mockResolvedValue(
        mockPopularProducts,
      );

      // Mock performance.now to simulate slow execution (80ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1080); // 80ms difference

      const result = await controller.benchmarkPopular();

      expect(result.performanceRating).toBe('Needs Improvement');
      expect(result.executionTime).toBe(80);
    });

    it('should handle popular products errors', async () => {
      mockProductsService.getPopularProducts.mockRejectedValue(
        new Error('Popular fetch failed'),
      );

      const result = await controller.benchmarkPopular();

      expect(result.operation).toContain('failed');
      expect(result.resultCount).toBe(0);
      expect(result.performanceRating).toBe('Needs Improvement');
    });

    it('should handle non-Error exceptions in popular benchmark', async () => {
      mockProductsService.getPopularProducts.mockRejectedValue('String error');

      const result = await controller.benchmarkPopular();

      expect(result.operation).toContain('failed');
      expect(result.performanceRating).toBe('Needs Improvement');
    });
  });

  describe('benchmarkRecent', () => {
    it('should return recent products benchmark', async () => {
      const mockRecentProducts = [
        { id: 1, title: 'Recent Product', category: 'Books' },
      ];
      mockProductsService.getRecentProducts.mockResolvedValue(
        mockRecentProducts,
      );

      const result = await controller.benchmarkRecent();

      expect(result).toBeDefined();
      expect(result.operation).toBe('Recent Products Listing');
      expect(result.executionTime).toBeDefined();
      expect(result.resultCount).toBe(1);
      expect(result.performanceRating).toBeDefined();
      expect(mockProductsService.getRecentProducts).toHaveBeenCalledWith(20);
    });

    it('should return Excellent rating for very fast execution', async () => {
      const mockRecentProducts = [{ id: 1, title: 'Recent Product' }];
      mockProductsService.getRecentProducts.mockResolvedValue(
        mockRecentProducts,
      );

      // Mock performance.now to simulate very fast execution (< 25ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1015); // 15ms difference

      const result = await controller.benchmarkRecent();

      expect(result.performanceRating).toBe('Excellent');
      expect(result.executionTime).toBe(15);
    });

    it('should return Good rating for medium execution', async () => {
      const mockRecentProducts = [{ id: 1, title: 'Recent Product' }];
      mockProductsService.getRecentProducts.mockResolvedValue(
        mockRecentProducts,
      );

      // Mock performance.now to simulate medium execution (35ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1035); // 35ms difference

      const result = await controller.benchmarkRecent();

      expect(result.performanceRating).toBe('Good');
      expect(result.executionTime).toBe(35);
    });

    it('should return Needs Improvement rating for slow execution', async () => {
      const mockRecentProducts = [{ id: 1, title: 'Recent Product' }];
      mockProductsService.getRecentProducts.mockResolvedValue(
        mockRecentProducts,
      );

      // Mock performance.now to simulate slow execution (70ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1070); // 70ms difference

      const result = await controller.benchmarkRecent();

      expect(result.performanceRating).toBe('Needs Improvement');
      expect(result.executionTime).toBe(70);
    });

    it('should handle recent products errors', async () => {
      mockProductsService.getRecentProducts.mockRejectedValue(
        new Error('Recent fetch failed'),
      );

      const result = await controller.benchmarkRecent();

      expect(result.operation).toContain('failed');
      expect(result.resultCount).toBe(0);
      expect(result.performanceRating).toBe('Needs Improvement');
    });

    it('should handle non-Error exceptions in recent benchmark', async () => {
      mockProductsService.getRecentProducts.mockRejectedValue('String error');

      const result = await controller.benchmarkRecent();

      expect(result.operation).toContain('failed');
      expect(result.performanceRating).toBe('Needs Improvement');
    });
  });

  describe('benchmarkCategory', () => {
    it('should return category benchmark', async () => {
      const mockCategoryProducts = {
        data: [{ id: 1, title: 'Category Product', category: 'Electronics' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.getProductsByCategory.mockResolvedValue(
        mockCategoryProducts,
      );

      const result = await controller.benchmarkCategory('1');

      expect(result).toBeDefined();
      expect(result.operation).toContain('Category Products');
      expect(result.executionTime).toBeDefined();
      expect(result.resultCount).toBe(1);
      expect(result.performanceRating).toBeDefined();
      expect(mockProductsService.getProductsByCategory).toHaveBeenCalledWith(
        '1',
        1,
        20,
      );
    });

    it('should return Excellent rating for very fast execution', async () => {
      const mockCategoryProducts = {
        data: [{ id: 1, title: 'Category Product' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.getProductsByCategory.mockResolvedValue(
        mockCategoryProducts,
      );

      // Mock performance.now to simulate very fast execution (< 40ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1025); // 25ms difference

      const result = await controller.benchmarkCategory('1');

      expect(result.performanceRating).toBe('Excellent');
      expect(result.executionTime).toBe(25);
    });

    it('should return Good rating for medium execution', async () => {
      const mockCategoryProducts = {
        data: [{ id: 1, title: 'Category Product' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.getProductsByCategory.mockResolvedValue(
        mockCategoryProducts,
      );

      // Mock performance.now to simulate medium execution (60ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1060); // 60ms difference

      const result = await controller.benchmarkCategory('1');

      expect(result.performanceRating).toBe('Good');
      expect(result.executionTime).toBe(60);
    });

    it('should return Needs Improvement rating for slow execution', async () => {
      const mockCategoryProducts = {
        data: [{ id: 1, title: 'Category Product' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockProductsService.getProductsByCategory.mockResolvedValue(
        mockCategoryProducts,
      );

      // Mock performance.now to simulate slow execution (100ms)
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100); // 100ms difference

      const result = await controller.benchmarkCategory('1');

      expect(result.performanceRating).toBe('Needs Improvement');
      expect(result.executionTime).toBe(100);
    });

    it('should handle category benchmark errors', async () => {
      mockProductsService.getProductsByCategory.mockRejectedValue(
        new Error('Category fetch failed'),
      );

      const result = await controller.benchmarkCategory('1');

      expect(result.operation).toContain('failed');
      expect(result.resultCount).toBe(0);
      expect(result.performanceRating).toBe('Needs Improvement');
    });

    it('should handle non-Error exceptions in category benchmark', async () => {
      mockProductsService.getProductsByCategory.mockRejectedValue(
        'String error',
      );

      const result = await controller.benchmarkCategory('1');

      expect(result.operation).toContain('failed');
      expect(result.performanceRating).toBe('Needs Improvement');
    });
  });

  describe('getSystemInfo', () => {
    it('should return system architecture information', () => {
      const result = controller.getSystemInfo();

      expect(result).toBeDefined();
      expect(result.architecture).toContain('NestJS + TypeORM + PostgreSQL');
      expect(result.database).toContain('PostgreSQL with 29 strategic indexes');
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.monitoring).toBeInstanceOf(Array);
      expect(result.scalability).toBeInstanceOf(Array);
    });

    it('should include optimization details', () => {
      const result = controller.getSystemInfo();

      expect(result.optimizations.length).toBeGreaterThan(0);
      expect(result.optimizations).toContain(
        '15 composite B-Tree indexes for complex queries',
      );
      expect(result.optimizations).toContain(
        '6 GIN indexes for full-text search capabilities',
      );
    });

    it('should include monitoring capabilities', () => {
      const result = controller.getSystemInfo();

      expect(result.monitoring).toContain('Real-time performance benchmarking');
      expect(result.monitoring).toContain('Query execution time tracking');
    });

    it('should include scalability information', () => {
      const result = controller.getSystemInfo();

      expect(result.scalability).toContain(
        'Tested with 5,000+ product dataset',
      );
      expect(result.scalability).toContain(
        'Architecture ready for 100K+ products',
      );
    });
  });
});
