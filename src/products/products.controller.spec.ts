import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesService } from '../categories/categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getPopularProducts: jest.fn(),
    getRecentProducts: jest.fn(),
    getProductBySlug: jest.fn(),
    getProductBySlugPublic: jest.fn(),
    searchProducts: jest.fn(),
    searchProductsPublic: jest.fn(),
    getProductById: jest.fn(),
    getAllProducts: jest.fn(),
  };

  const mockCategoriesService = {
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getAllCategories: jest.fn(),
    getCategoryById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Product Management', () => {
    it('should have product management methods', () => {
      expect(typeof controller.createProduct).toBe('function');
      expect(typeof controller.updateProduct).toBe('function');
      expect(typeof controller.deleteProduct).toBe('function');
      expect(typeof controller.getProductById).toBe('function');
    });
  });

  describe('Category Management', () => {
    it('should have category management methods', () => {
      expect(typeof controller.createCategory).toBe('function');
      expect(typeof controller.updateCategory).toBe('function');
      expect(typeof controller.deleteCategory).toBe('function');
      expect(typeof controller.getAllCategories).toBe('function');
      expect(typeof controller.getCategoryById).toBe('function');
    });
  });

  describe('Public Endpoints', () => {
    it('should have public endpoints', () => {
      expect(typeof controller.getAllProducts).toBe('function');
      expect(typeof controller.searchProducts).toBe('function');
    });
  });
});
