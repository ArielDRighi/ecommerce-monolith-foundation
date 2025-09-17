import { validate } from 'class-validator';
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
});
