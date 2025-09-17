/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  CreateCategoryDto,
} from './dto';
import { User, UserRole } from '../auth/entities/user.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockUser: User = {
    id: 'user-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  } as User;

  const mockProductResponse: ProductResponseDto = {
    id: 'product-id',
    name: 'Test Product',
    description: 'Test Description',
    slug: 'test-product',
    price: 99.99,
    stock: 10,
    isActive: true,
    categories: [],
    images: [],
    attributes: {},
    averageRating: 4.5,
    reviewCount: 5,
    viewCount: 100,
    orderCount: 10,
    isInStock: true,
    isLowStock: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockUser,
  };

  const mockCategory = {
    id: 'category-id',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test Category Description',
    isActive: true,
    sortOrder: 1,
    productsCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductsService = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      getPopularProducts: jest.fn(),
      getRecentProducts: jest.fn(),
      getProductsByCategory: jest.fn(),
      getProductBySlug: jest.fn(),
      searchProducts: jest.fn(),
      getProductById: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getAllCategories: jest.fn(),
      getCategoryById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Product Management', () => {
    describe('createProduct', () => {
      it('should create a product', async () => {
        const createDto: CreateProductDto = {
          name: 'New Product',
          description: 'New Description',
          slug: 'new-product',
          price: 149.99,
          stock: 20,
          categoryIds: ['category-id'],
        };

        service.createProduct.mockResolvedValue(mockProductResponse);

        const result = await controller.createProduct(createDto, mockUser);

        expect(service.createProduct).toHaveBeenCalledWith(createDto, mockUser);
        expect(result).toBe(mockProductResponse);
      });
    });

    describe('updateProduct', () => {
      it('should update a product', async () => {
        const updateDto: UpdateProductDto = {
          name: 'Updated Product',
          price: 199.99,
        };

        service.updateProduct.mockResolvedValue(mockProductResponse);

        const result = await controller.updateProduct('product-id', updateDto);

        expect(service.updateProduct).toHaveBeenCalledWith(
          'product-id',
          updateDto,
        );
        expect(result).toBe(mockProductResponse);
      });
    });

    describe('deleteProduct', () => {
      it('should delete a product', async () => {
        service.deleteProduct.mockResolvedValue(undefined);

        await controller.deleteProduct('product-id');

        expect(service.deleteProduct).toHaveBeenCalledWith('product-id');
      });
    });

    describe('getPopularProducts', () => {
      it('should get popular products', async () => {
        const products = [mockProductResponse];
        service.getPopularProducts.mockResolvedValue(products);

        const result = await controller.getPopularProducts();

        expect(service.getPopularProducts).toHaveBeenCalled();
        expect(result).toBe(products);
      });
    });

    describe('getRecentProducts', () => {
      it('should get recent products', async () => {
        const products = [mockProductResponse];
        service.getRecentProducts.mockResolvedValue(products);

        const result = await controller.getRecentProducts();

        expect(service.getRecentProducts).toHaveBeenCalled();
        expect(result).toBe(products);
      });
    });

    describe('getProductBySlug', () => {
      it('should get product by slug', async () => {
        service.getProductBySlug.mockResolvedValue(mockProductResponse);

        const result = await controller.getProductBySlug('test-product');

        expect(service.getProductBySlug).toHaveBeenCalledWith('test-product');
        expect(result).toBe(mockProductResponse);
      });
    });

    describe('getProductById', () => {
      it('should get product by id', async () => {
        service.getProductById.mockResolvedValue(mockProductResponse);

        const result = await controller.getProductById('product-id');

        expect(service.getProductById).toHaveBeenCalledWith('product-id');
        expect(result).toBe(mockProductResponse);
      });
    });
  });

  describe('Category Management', () => {
    describe('createCategory', () => {
      it('should create a category', async () => {
        const createCategoryDto: CreateCategoryDto = {
          name: 'New Category',
          description: 'New Category Description',
          slug: 'new-category',
        };

        service.createCategory.mockResolvedValue(mockCategory);

        const result = await controller.createCategory(createCategoryDto);

        expect(service.createCategory).toHaveBeenCalledWith(createCategoryDto);
        expect(result).toBe(mockCategory);
      });
    });

    describe('getAllCategories', () => {
      it('should return all categories', async () => {
        const categories = [mockCategory];
        service.getAllCategories.mockResolvedValue(categories);

        const result = await controller.getAllCategories();

        expect(service.getAllCategories).toHaveBeenCalled();
        expect(result).toBe(categories);
      });
    });

    describe('getCategoryById', () => {
      it('should return a category by id', async () => {
        service.getCategoryById.mockResolvedValue(mockCategory);

        const result = await controller.getCategoryById('category-id');

        expect(service.getCategoryById).toHaveBeenCalledWith('category-id');
        expect(result).toBe(mockCategory);
      });
    });

    describe('deleteCategory', () => {
      it('should delete a category', async () => {
        service.deleteCategory.mockResolvedValue(undefined);

        await controller.deleteCategory('category-id');

        expect(service.deleteCategory).toHaveBeenCalledWith('category-id');
      });
    });
  });
});
