/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
import { ProductSortBy, SortOrder } from './dto';

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
    isDeleted: false,
    isRecent: false,
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
      jest
        .spyOn(productRepository, 'save')
        .mockResolvedValue(updatedProduct as any);

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

    it('should update only name when only name is provided', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue({
        ...mockCategory,
        name: 'Updated Name',
      } as unknown as Category);

      const result = await service.updateCategory('cat-id-1', {
        name: 'Updated Name',
      });

      expect(result).toBeDefined();
      expect(categoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        }),
      );
    });

    it('should update only slug when only slug is provided', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;

      jest
        .spyOn(categoryRepository, 'findOne')
        .mockResolvedValueOnce(mockCategory) // First call to find category
        .mockResolvedValueOnce(null); // Second call to check slug conflict
      jest.spyOn(categoryRepository, 'save').mockResolvedValue({
        ...mockCategory,
        slug: 'new-slug',
      } as unknown as Category);

      const result = await service.updateCategory('cat-id-1', {
        slug: 'new-slug',
      });

      expect(result).toBeDefined();
      expect(categoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'new-slug',
        }),
      );
    });

    it('should update only description when only description is provided', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue({
        ...mockCategory,
        description: 'Updated description',
      } as unknown as Category);

      const result = await service.updateCategory('cat-id-1', {
        description: 'Updated description',
      });

      expect(result).toBeDefined();
      expect(categoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Updated description',
        }),
      );
    });

    it('should update only isActive when only isActive is provided', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue({
        ...mockCategory,
        isActive: false,
      } as unknown as Category);

      const result = await service.updateCategory('cat-id-1', {
        isActive: false,
      });

      expect(result).toBeDefined();
      expect(categoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
    });

    it('should handle undefined values in update dto', async () => {
      const mockCategory = {
        id: 'cat-id-1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
      } as unknown as Category;

      const updateDto = {
        name: undefined,
        slug: undefined,
        description: undefined,
        isActive: undefined,
      };

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue(mockCategory);

      const result = await service.updateCategory('cat-id-1', updateDto);

      expect(result).toBeDefined();
      // Verify that undefined values don't overwrite existing values
      expect(categoryRepository.save).toHaveBeenCalledWith(mockCategory);
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

  // Additional tests to improve coverage
  describe('Coverage Enhancement Tests', () => {
    describe('createProduct edge cases', () => {
      it('should throw error for invalid category IDs', async () => {
        const createProductDto: CreateProductDto = {
          name: 'Test Product',
          description: 'Test Description',
          slug: 'test-product',
          price: 99.99,
          stock: 10,
          categoryIds: ['invalid-cat-1', 'invalid-cat-2'],
        };

        jest.spyOn(categoryRepository, 'find').mockResolvedValue([]);

        await expect(
          service.createProduct(createProductDto, mockUser),
        ).rejects.toThrow(BadRequestException);

        expect(categoryRepository.find).toHaveBeenCalledWith({
          where: {
            id: expect.any(Object),
            isActive: true,
            deletedAt: IsNull(),
          },
        });
      });

      it('should throw error for partially invalid category IDs', async () => {
        const createProductDto: CreateProductDto = {
          name: 'Test Product',
          description: 'Test Description',
          slug: 'test-product',
          price: 99.99,
          stock: 10,
          categoryIds: ['valid-cat-1', 'invalid-cat-2'],
        };

        const validCategory = {
          ...mockCategory,
          id: 'valid-cat-1',
          productCount: 0,
        };

        jest
          .spyOn(categoryRepository, 'find')
          .mockResolvedValue([validCategory as any]);

        await expect(
          service.createProduct(createProductDto, mockUser),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('searchProducts sorting variations', () => {
      beforeEach(() => {
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
          getCount: jest.fn().mockResolvedValue(0),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        jest
          .spyOn(productRepository, 'createQueryBuilder')
          .mockReturnValue(mockQueryBuilder as any);
      });

      it('should sort by RATING DESC with NULLS handling', async () => {
        const searchDto = {
          sortBy: ProductSortBy.RATING,
          sortOrder: SortOrder.DESC,
        };

        await service.searchProducts(searchDto);

        const queryBuilder = productRepository.createQueryBuilder();
        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'product.rating',
          'DESC',
          'NULLS LAST',
        );
      });

      it('should sort by RATING ASC with NULLS handling', async () => {
        const searchDto = {
          sortBy: ProductSortBy.RATING,
          sortOrder: SortOrder.ASC,
        };

        await service.searchProducts(searchDto);

        const queryBuilder = productRepository.createQueryBuilder();
        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'product.rating',
          'ASC',
          'NULLS FIRST',
        );
      });

      it('should sort by POPULARITY', async () => {
        const searchDto = {
          sortBy: ProductSortBy.POPULARITY,
          sortOrder: SortOrder.DESC,
        };

        await service.searchProducts(searchDto);

        const queryBuilder = productRepository.createQueryBuilder();
        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'product.orderCount',
          'DESC',
        );
      });

      it('should sort by VIEWS', async () => {
        const searchDto = {
          sortBy: ProductSortBy.VIEWS,
          sortOrder: SortOrder.ASC,
        };

        await service.searchProducts(searchDto);

        const queryBuilder = productRepository.createQueryBuilder();
        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'product.viewCount',
          'ASC',
        );
      });

      it('should add secondary sort for non-CREATED_AT sorting', async () => {
        const searchDto = {
          sortBy: ProductSortBy.NAME,
          sortOrder: SortOrder.ASC,
        };

        await service.searchProducts(searchDto);

        const queryBuilder = productRepository.createQueryBuilder();
        expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
          'product.id',
          'ASC',
        );
      });
    });

    describe('updateProduct edge cases', () => {
      it('should handle partial category update correctly', async () => {
        const updateProductDto: UpdateProductDto = {
          name: 'Updated Product',
        };

        const existingProduct = {
          ...mockProduct,
          categories: [mockCategory],
          isInStock: true,
          isLowStock: false,
          averageRating: 4.5,
        };

        jest
          .spyOn(productRepository, 'findOne')
          .mockResolvedValue(existingProduct as any);
        jest.spyOn(productRepository, 'save').mockResolvedValue({
          ...existingProduct,
          ...updateProductDto,
        } as any);

        const result = await service.updateProduct(
          'prod-id-1',
          updateProductDto,
        );

        expect(result).toBeDefined();
        expect(productRepository.save).toHaveBeenCalled();
      });
    });

    describe('category management edge cases', () => {
      it('should handle category creation with duplicate slug detection', async () => {
        const createCategoryDto: CreateCategoryDto = {
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test Description',
          isActive: true,
        };

        // First call to check existing slug - return null (not found)
        // Second call is for creating the category
        jest
          .spyOn(categoryRepository, 'findOne')
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockCategory);

        jest.spyOn(categoryRepository, 'create').mockReturnValue(mockCategory);
        jest.spyOn(categoryRepository, 'save').mockResolvedValue(mockCategory);

        const result = await service.createCategory(createCategoryDto);

        expect(result).toBeDefined();
        expect(categoryRepository.save).toHaveBeenCalled();
      });
    });
  });

  describe('getAllProducts', () => {
    it('should return paginated products without filters', async () => {
      const mockProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllProducts({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: [expect.any(Object)],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = true',
      );
    });

    it('should return paginated products with category filter', async () => {
      const mockProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllProducts({
        page: 1,
        limit: 20,
        category: 'electronics',
      });

      expect(result).toEqual({
        data: [expect.any(Object)],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.slug = :categorySlug',
        { categorySlug: 'electronics' },
      );
    });

    it('should return paginated products with price filters', async () => {
      const mockProducts = [mockProduct];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProducts),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllProducts({
        page: 2,
        limit: 10,
        minPrice: 50,
        maxPrice: 500,
      });

      expect(result).toEqual({
        data: [expect.any(Object)],
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 50 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price <= :maxPrice',
        { maxPrice: 500 },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });
});
