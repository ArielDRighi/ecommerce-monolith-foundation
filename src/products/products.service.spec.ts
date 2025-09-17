import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull, UpdateResult } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductSearchDto,
  CreateCategoryDto,
} from './dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
    sortOrder: 1,
    productCount: 0,
  } as Category;

  const mockProduct = {
    id: 'prod-id-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    price: 99.99,
    stock: 10,
    isActive: true,
    createdBy: mockUser,
    categories: [mockCategory],
    createdAt: new Date(),
    updatedAt: new Date(),
    isInStock: true,
    isLowStock: false,
    averageRating: 4.5,
  } as Product;

  const mockCreateProductDto: CreateProductDto = {
    name: 'New Product',
    slug: 'new-product',
    description: 'A new product',
    price: 199.99,
    stock: 5,
    categoryIds: ['cat-id-1'],
  };

  const mockUpdateProductDto: UpdateProductDto = {
    name: 'Updated Product',
    price: 299.99,
  };

  const mockCreateCategoryDto: CreateCategoryDto = {
    name: 'New Category',
    slug: 'new-category',
    description: 'A new category',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            findByIds: jest.fn(),
            increment: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const findOneSpy = jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(null);
      const findSpy = jest
        .spyOn(categoryRepository, 'find')
        .mockResolvedValue([mockCategory]);
      const createSpy = jest
        .spyOn(productRepository, 'create')
        .mockReturnValue(mockProduct);
      const saveSpy = jest
        .spyOn(productRepository, 'save')
        .mockResolvedValue(mockProduct);

      const result = await service.createProduct(
        mockCreateProductDto,
        mockUser,
      );

      expect(findOneSpy).toHaveBeenCalled();
      expect(findSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if slug exists', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);

      await expect(
        service.createProduct(mockCreateProductDto, mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
        price: 299.99,
        isInStock: true,
        isLowStock: false,
        averageRating: 4.5,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(productRepository, 'save').mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(
        'prod-id-1',
        mockUpdateProductDto,
      );

      expect(result.name).toBe(mockUpdateProductDto.name);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateProduct('non-existent-id', mockUpdateProductDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      const softDeleteSpy = jest
        .spyOn(productRepository, 'softDelete')
        .mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.deleteProduct('prod-id-1');

      expect(softDeleteSpy).toHaveBeenCalledWith('prod-id-1');
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest
        .spyOn(productRepository, 'increment')
        .mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.getProductById('prod-id-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProductById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPopularProducts', () => {
    it('should return popular products', async () => {
      const popularProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(popularProducts),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const result = await service.getPopularProducts(5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRecentProducts', () => {
    it('should return recent products', async () => {
      const recentProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(recentProducts),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const result = await service.getRecentProducts(5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(categoryRepository, 'create').mockReturnValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue(mockCategory);

      const result = await service.createCategory(mockCreateCategoryDto);

      expect(result).toBeDefined();
    });

    it('should throw ConflictException if slug exists', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);

      await expect(
        service.createCategory(mockCreateCategoryDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAllCategories', () => {
    it('should return all active categories', async () => {
      const categories = [mockCategory];
      jest.spyOn(categoryRepository, 'find').mockResolvedValue(categories);

      const result = await service.getAllCategories();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);

      const result = await service.getCategoryById('cat-id-1');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getCategoryById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchProducts', () => {
    it('should handle search with basic parameters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      // Mock query builder
      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.searchProducts(searchDto);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle search with text query (>=3 chars)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        search: 'smartphone',
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('to_tsvector'),
        { searchTerm: 'smartphone' },
      );
    });

    it('should handle search with short text query (<3 chars)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        search: 'tv',
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.name % :searchTerm OR product.description % :searchTerm)',
        { searchTerm: 'tv' },
      );
    });

    it('should handle search with category filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        categoryId: '1',
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: '1' },
      );
    });

    it('should handle search with price range filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        minPrice: 100,
        maxPrice: 500,
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price BETWEEN :minPrice AND :maxPrice',
        { minPrice: 100, maxPrice: 500 },
      );
    });

    it('should handle search with minimum price only', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        minPrice: 100,
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 100 },
      );
    });

    it('should handle search with maximum price only', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        maxPrice: 500,
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price <= :maxPrice',
        { maxPrice: 500 },
      );
    });

    it('should handle search with stock filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        inStock: true,
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.stock > 0',
      );
    });

    it('should handle search with minimum rating filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        clone: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const searchDto: ProductSearchDto = {
        minRating: 4,
        page: 1,
        limit: 10,
      };

      await service.searchProducts(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.rating >= :minRating OR product.rating IS NULL)',
        { minRating: 4 },
      );
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category with pagination', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      const result = await service.getProductsByCategory('1', 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toHaveProperty('length', 1);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: '1' },
      );
    });

    it('should apply pagination correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      await service.getProductsByCategory('1', 2, 10);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should limit maximum results per page', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as any);

      await service.getProductsByCategory('1', 1, 150);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });

  describe('getProductBySlug', () => {
    it('should return product by slug and increment view count', async () => {
      const findOneSpy = jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(mockProduct);
      const incrementSpy = jest
        .spyOn(productRepository, 'increment')
        .mockResolvedValue({
          generatedMaps: [],
          raw: [],
          affected: 1,
        });

      const result = await service.getProductBySlug('test-product');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { slug: 'test-product', deletedAt: IsNull(), isActive: true },
        relations: ['categories', 'createdBy'],
      });
      expect(incrementSpy).toHaveBeenCalledWith(
        { id: 'prod-id-1' },
        'viewCount',
        1,
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      const findOneSpy = jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(service.getProductBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { slug: 'non-existent', deletedAt: IsNull(), isActive: true },
        relations: ['categories', 'createdBy'],
      });
    });

    it('should handle view count increment failures silently', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      const incrementSpy = jest
        .spyOn(productRepository, 'increment')
        .mockRejectedValue(new Error('DB Error'));

      const result = await service.getProductBySlug('test-product');

      expect(result).toBeDefined();
      expect(incrementSpy).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;
      const updateDto = {
        name: 'Updated Electronics',
        description: 'Updated description',
      };

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      } as unknown as Category);

      const result = await service.updateCategory('cat-id-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Electronics');
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateCategory('non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if slug conflicts', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        isActive: true,
      } as unknown as Category;
      const existingCategory = {
        id: 'cat-id-2',
        slug: 'new-slug',
        name: 'Existing',
        isActive: true,
      } as unknown as Category;

      jest
        .spyOn(categoryRepository, 'findOne')
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(existingCategory);

      await expect(
        service.updateCategory('cat-id-1', { slug: 'new-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        products: [],
      } as unknown as Category;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      const softDeleteSpy = jest
        .spyOn(categoryRepository, 'softDelete')
        .mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.deleteCategory('cat-id-1');

      expect(softDeleteSpy).toHaveBeenCalledWith('cat-id-1');
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteCategory('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if category has products', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        products: [{ id: 'prod-1' }],
      } as unknown as Category;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);

      await expect(service.deleteCategory('cat-id-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
