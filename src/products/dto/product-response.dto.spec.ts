/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { plainToClass } from 'class-transformer';
import {
  ProductResponseDto,
  CategoryResponseDto,
} from './product-response.dto';

describe('ProductResponseDto', () => {
  let product: ProductResponseDto;

  beforeEach(() => {
    product = plainToClass(ProductResponseDto, {
      id: 'product-id',
      name: 'Test Product',
      description: 'Test description',
      price: 99.99,
      stock: 15,
      rating: 4.5,
      reviewCount: 10,
      images: ['image1.jpg', 'image2.jpg'],
      attributes: { color: 'red', size: 'M' },
      categories: [
        {
          id: 'category-id',
          name: 'Test Category',
          slug: 'test-category',
          isActive: true,
        },
      ],
      createdBy: {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should be defined', () => {
    expect(product).toBeDefined();
  });

  describe('isInStock', () => {
    it('should return true when stock is greater than 0', () => {
      product.stock = 5;
      expect(product.isInStock).toBe(true);
    });

    it('should return false when stock is 0', () => {
      product.stock = 0;
      expect(product.isInStock).toBe(false);
    });

    it('should return false when stock is negative', () => {
      product.stock = -1;
      expect(product.isInStock).toBe(false);
    });
  });

  describe('isLowStock', () => {
    it('should return true when stock is between 1 and 10', () => {
      product.stock = 5;
      expect(product.isLowStock).toBe(true);
    });

    it('should return true when stock is exactly 10', () => {
      product.stock = 10;
      expect(product.isLowStock).toBe(true);
    });

    it('should return false when stock is 0', () => {
      product.stock = 0;
      expect(product.isLowStock).toBe(false);
    });

    it('should return false when stock is greater than 10', () => {
      product.stock = 15;
      expect(product.isLowStock).toBe(false);
    });

    it('should return false when stock is negative', () => {
      product.stock = -1;
      expect(product.isLowStock).toBe(false);
    });
  });

  describe('averageRating', () => {
    it('should return the rating when it exists', () => {
      product.rating = 4.5;
      expect(product.averageRating).toBe(4.5);
    });

    it('should return 0 when rating is null', () => {
      product.rating = null as any;
      expect(product.averageRating).toBe(0);
    });

    it('should return 0 when rating is undefined', () => {
      product.rating = undefined as any;
      expect(product.averageRating).toBe(0);
    });

    it('should return 0 when rating is 0', () => {
      product.rating = 0;
      expect(product.averageRating).toBe(0);
    });
  });
});

describe('CategoryResponseDto', () => {
  it('should be defined', () => {
    const category = plainToClass(CategoryResponseDto, {
      id: 'category-id',
      name: 'Test Category',
      slug: 'test-category',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(category).toBeDefined();
    expect(category.id).toBe('category-id');
    expect(category.name).toBe('Test Category');
    expect(category.slug).toBe('test-category');
    expect(category.isActive).toBe(true);
  });

  it('should handle optional description', () => {
    const category = plainToClass(CategoryResponseDto, {
      id: 'category-id',
      name: 'Test Category',
      slug: 'test-category',
      isActive: true,
      description: 'Test description',
    });

    expect(category.description).toBe('Test description');
  });
});
