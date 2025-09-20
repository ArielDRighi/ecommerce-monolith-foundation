/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoriesService } from '../categories/categories.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { IProductRepository } from './interfaces/product-repository.interface';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductSearchDto,
} from './dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: IProductRepository;
  let categoriesService: CategoriesService;

  // Mock data
  const mockUser = {
    id: 'user-id-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  } as User;

  const mockCategory = {
    id: 'cat-id-1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices',
    isActive: true,
    isDeleted: false,
    isRecent: false,
    sortOrder: 0,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
  } as Category;

  const mockProduct = {
    id: 'prod-id-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    isActive: true,
    isDeleted: false,
    isRecent: false,
    categories: [mockCategory],
    images: [],
    attributes: {},
    viewCount: 0,
    orderCount: 0,
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockUser,
    createdById: 'user-id-1',
    isInStock: true,
    isLowStock: false,
  } as Product;

  const mockCreateProductDto: CreateProductDto = {
    name: 'Test Product',
    description: 'Test Description',
    slug: 'test-product',
    price: 99.99,
    stock: 10,
    categoryIds: ['cat-id-1'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: 'IProductRepository',
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
            increment: jest.fn().mockResolvedValue(undefined),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            validateCategoryIds: jest.fn().mockResolvedValue([mockCategory]),
            getAllCategories: jest.fn(),
            getCategoryById: jest.fn(),
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get('IProductRepository');
    categoriesService = module.get<CategoriesService>(CategoriesService);

    // Clear all mocks after module setup
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Mock that slug doesn't exist
      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValueOnce(null) // for slug check
        .mockResolvedValueOnce(mockProduct); // for fetching with relations

      // Mock category validation
      jest
        .spyOn(categoriesService, 'validateCategoryIds')
        .mockResolvedValue([mockCategory]);

      // Mock product creation and saving
      jest.spyOn(productRepository, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepository, 'save').mockResolvedValue(mockProduct);

      const result = await service.createProduct(
        mockCreateProductDto,
        mockUser,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Product');
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);

      const result = await service.getProductById('prod-id-1');

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Product');
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProductById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(productRepository, 'save').mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
        price: 149.99,
      } as Product);

      const result = await service.updateProduct('prod-id-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(productRepository, 'softDelete').mockResolvedValue(undefined);

      await service.deleteProduct('prod-id-1');

      expect(productRepository.softDelete).toHaveBeenCalledWith('prod-id-1');
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteProduct('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProductBySlug', () => {
    it('should return product and increment view count', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      const incrementSpy = jest
        .spyOn(productRepository, 'increment')
        .mockResolvedValue(undefined);

      const result = await service.getProductBySlug('test-product');

      expect(result).toBeDefined();
      expect(incrementSpy).toHaveBeenCalledWith(
        { id: 'prod-id-1' },
        'viewCount',
        1,
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return paginated products', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllProducts({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const searchDto: ProductSearchDto = {
        search: 'test',
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.searchProducts(searchDto);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
    });
  });
});
