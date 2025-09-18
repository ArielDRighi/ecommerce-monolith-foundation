import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsController } from './analytics.controller';
import { ProductsService } from '../products/products.service';

describe('AnalyticsModule', () => {
  let module: TestingModule;

  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    findByCategory: jest.fn().mockResolvedValue([]),
    findInPriceRange: jest.fn().mockResolvedValue([]),
    searchByName: jest.fn().mockResolvedValue([]),
    updateStock: jest.fn().mockResolvedValue({}),
    getPopularProducts: jest.fn().mockResolvedValue([]),
    getLowStockProducts: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AnalyticsController', () => {
    const controller = module.get<AnalyticsController>(AnalyticsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AnalyticsController);
  });

  it('should have correct module structure', () => {
    expect(AnalyticsModule).toBeDefined();
    expect(typeof AnalyticsModule).toBe('function');
  });

  it('should be a valid NestJS module', () => {
    expect(AnalyticsModule.name).toBe('AnalyticsModule');
  });
});
