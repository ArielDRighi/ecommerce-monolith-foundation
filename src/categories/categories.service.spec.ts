import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Logger } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        Logger,
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const createCategoryDto = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true,
      };

      const mockCategory = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true,
      };

      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.createCategory(createCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
      expect(mockCategoryRepository.create).toHaveBeenCalled();
      expect(mockCategoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          isActive: true,
        },
      ];

      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.find).toHaveBeenCalled();
    });
  });

  describe('getCategoryById', () => {
    it('should return a category by id', async () => {
      const mockCategory = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        isActive: true,
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.getCategoryById('1');

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      const updateCategoryDto = {
        name: 'Updated Electronics',
        description: 'Updated description',
      };

      const mockCategory = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        isActive: true,
      };

      const updatedCategory = { ...mockCategory, ...updateCategoryDto };

      // Reset and configure mocks specifically for this test
      mockCategoryRepository.findOne.mockReset();
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(mockCategory) // for finding category to update
        .mockResolvedValueOnce(null); // for slug conflict check
      mockCategoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory('1', updateCategoryDto);

      expect(result).toEqual(updatedCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: IsNull() },
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        isActive: true,
        products: [], // Empty products array
      };

      // Reset and configure mocks specifically for this test
      mockCategoryRepository.findOne.mockReset();
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteCategory('1');

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: IsNull() },
        relations: ['products'],
      });
      expect(mockCategoryRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('existsById', () => {
    it('should return true if category exists', async () => {
      mockCategoryRepository.count.mockResolvedValue(1);

      const result = await service.existsById('1');

      expect(result).toBe(true);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: IsNull(), isActive: true },
      });
    });

    it('should return false if category does not exist', async () => {
      mockCategoryRepository.count.mockResolvedValue(0);

      const result = await service.existsById('999');

      expect(result).toBe(false);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith({
        where: { id: '999', deletedAt: IsNull(), isActive: true },
      });
    });
  });

  describe('validateCategoryIds', () => {
    it('should validate existing category IDs', async () => {
      const categoryIds = ['1', '2'];
      const categories = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Books' },
      ];

      mockCategoryRepository.find.mockResolvedValue(categories);

      await service.validateCategoryIds(categoryIds);

      expect(mockCategoryRepository.find).toHaveBeenCalled();
    });
  });
});
