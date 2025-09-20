import { Test, TestingModule } from '@nestjs/testing';
import { ProductsModule } from './products.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesService } from '../categories/categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';

// Mock repository interfaces
const mockProductRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn().mockResolvedValue(undefined),
  count: jest.fn(),
  increment: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  })),
};

const mockCategoryRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  softDelete: jest.fn(),
  count: jest.fn(),
};

describe('ProductsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: 'IProductRepository',
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: CategoriesService,
          useValue: {
            validateCategoryIds: jest.fn(),
            getAllCategories: jest.fn(),
            getCategoryById: jest.fn(),
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
          },
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

  it('should provide ProductsController', () => {
    const controller = module.get<ProductsController>(ProductsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(ProductsController);
  });

  it('should provide ProductsService', () => {
    const service = module.get<ProductsService>(ProductsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ProductsService);
  });

  it('should have correct module structure', () => {
    expect(ProductsModule).toBeDefined();
    expect(typeof ProductsModule).toBe('function');
  });
});
