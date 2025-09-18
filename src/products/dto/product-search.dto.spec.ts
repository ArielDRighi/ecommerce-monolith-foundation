import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductSearchDto } from './product-search.dto';

describe('ProductSearchDto', () => {
  it('should be defined', () => {
    expect(ProductSearchDto).toBeDefined();
  });

  describe('minPrice transform', () => {
    it('should transform string to number', () => {
      const dto = plainToClass(ProductSearchDto, { minPrice: '100.5' });
      expect(dto.minPrice).toBe(100.5);
    });

    it('should handle undefined values', () => {
      const dto = plainToClass(ProductSearchDto, { minPrice: undefined });
      expect(dto.minPrice).toBeUndefined();
    });

    it('should handle null values', () => {
      const dto = plainToClass(ProductSearchDto, { minPrice: null });
      expect(dto.minPrice).toBeUndefined();
    });
  });

  describe('maxPrice transform', () => {
    it('should transform string to number', () => {
      const dto = plainToClass(ProductSearchDto, { maxPrice: '200.75' });
      expect(dto.maxPrice).toBe(200.75);
    });

    it('should handle undefined values', () => {
      const dto = plainToClass(ProductSearchDto, { maxPrice: undefined });
      expect(dto.maxPrice).toBeUndefined();
    });
  });

  describe('inStock transform', () => {
    it('should handle undefined values', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: undefined });
      expect(dto.inStock).toBeUndefined();
    });

    it('should handle null values', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: null });
      expect(dto.inStock).toBeUndefined();
    });

    it('should transform string "true" to boolean true', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 'true' });
      expect(dto.inStock).toBe(true);
    });

    it('should transform string "TRUE" to boolean true', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 'TRUE' });
      expect(dto.inStock).toBe(true);
    });

    it('should transform string "false" to boolean false', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 'false' });
      expect(dto.inStock).toBe(false);
    });

    it('should transform any other string to boolean false', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 'invalid' });
      expect(dto.inStock).toBe(false);
    });

    it('should transform number 1 to boolean true', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 1 });
      expect(dto.inStock).toBe(true);
    });

    it('should transform number 0 to boolean false', () => {
      const dto = plainToClass(ProductSearchDto, { inStock: 0 });
      expect(dto.inStock).toBe(false);
    });
  });

  describe('minRating transform', () => {
    it('should transform string to number', () => {
      const dto = plainToClass(ProductSearchDto, { minRating: '4.5' });
      expect(dto.minRating).toBe(4.5);
    });

    it('should handle undefined values', () => {
      const dto = plainToClass(ProductSearchDto, { minRating: undefined });
      expect(dto.minRating).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate successfully with valid data', async () => {
      const dto = plainToClass(ProductSearchDto, {
        query: 'test product',
        category: 'books',
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'ASC',
        minPrice: 10,
        maxPrice: 100,
        inStock: true,
        minRating: 4,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative minPrice', async () => {
      const dto = plainToClass(ProductSearchDto, { minPrice: -10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.min).toContain('negative');
    });

    it('should fail validation with invalid sortOrder', async () => {
      const dto = plainToClass(ProductSearchDto, { sortOrder: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
