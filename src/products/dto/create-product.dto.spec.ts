import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

describe('CreateProductDto', () => {
  it('should be valid with correct data', async () => {
    const dto = new CreateProductDto();
    dto.name = 'Test Product';
    dto.description = 'Test Description';
    dto.slug = 'test-product';
    dto.price = 99.99;
    dto.stock = 10;
    dto.categoryIds = ['550e8400-e29b-41d4-a716-446655440000'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with empty name', async () => {
    const dto = new CreateProductDto();
    dto.name = '';
    dto.slug = 'test-product';
    dto.price = 99.99;
    dto.stock = 10;
    dto.categoryIds = ['550e8400-e29b-41d4-a716-446655440000'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation with negative price', async () => {
    const dto = new CreateProductDto();
    dto.name = 'Test Product';
    dto.slug = 'test-product';
    dto.price = -10;
    dto.stock = 10;
    dto.categoryIds = ['550e8400-e29b-41d4-a716-446655440000'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');
  });

  it('should fail validation with negative stock', async () => {
    const dto = new CreateProductDto();
    dto.name = 'Test Product';
    dto.slug = 'test-product';
    dto.price = 99.99;
    dto.stock = -5;
    dto.categoryIds = ['550e8400-e29b-41d4-a716-446655440000'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('stock');
  });

  it('should fail validation with empty categoryIds', async () => {
    const dto = new CreateProductDto();
    dto.name = 'Test Product';
    dto.slug = 'test-product';
    dto.price = 99.99;
    dto.stock = 10;
    dto.categoryIds = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('categoryIds');
  });

  describe('transformations', () => {
    it('should transform string price to number', () => {
      const dto = plainToClass(CreateProductDto, { price: '99.99' });
      expect(dto.price).toBe(99.99);
      expect(typeof dto.price).toBe('number');
    });

    it('should transform string stock to integer', () => {
      const dto = plainToClass(CreateProductDto, { stock: '10' });
      expect(dto.stock).toBe(10);
      expect(typeof dto.stock).toBe('number');
    });

    it('should handle price transformation with non-numeric string', () => {
      const dto = plainToClass(CreateProductDto, { price: 'invalid' });
      expect(dto.price).toBeNaN();
    });

    it('should handle stock transformation with non-numeric string', () => {
      const dto = plainToClass(CreateProductDto, { stock: 'invalid' });
      expect(dto.stock).toBeNaN();
    });

    it('should transform isActive string to boolean', () => {
      const dto = plainToClass(CreateProductDto, { isActive: 'true' });
      expect(dto.isActive).toBe(true);
      expect(typeof dto.isActive).toBe('boolean');
    });

    it('should transform isActive FALSE string to boolean', () => {
      const dto = plainToClass(CreateProductDto, { isActive: 'false' });
      expect(dto.isActive).toBe(false);
    });

    it('should transform isActive non-boolean values', () => {
      const dto1 = plainToClass(CreateProductDto, { isActive: 1 });
      expect(dto1.isActive).toBe(true);

      const dto2 = plainToClass(CreateProductDto, { isActive: 0 });
      expect(dto2.isActive).toBe(false);

      const dto3 = plainToClass(CreateProductDto, { isActive: 'anything' });
      expect(dto3.isActive).toBe(false);
    });

    it('should handle null and undefined values in transformations', () => {
      const dto = plainToClass(CreateProductDto, {
        price: null,
        stock: undefined,
        isActive: null,
      });
      expect(dto.price).toBeNaN();
      expect(dto.stock).toBeNaN();
      expect(dto.isActive).toBe(false);
    });
  });
});
