import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateProductDto } from './update-product.dto';

describe('UpdateProductDto', () => {
  it('should validate a valid update product DTO', async () => {
    const dto = plainToClass(UpdateProductDto, {
      name: 'Updated Product',
      description: 'Updated description',
      price: 199.99,
      stock: 25,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when updating only name', async () => {
    const dto = plainToClass(UpdateProductDto, {
      name: 'New Product Name',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when updating only price', async () => {
    const dto = plainToClass(UpdateProductDto, {
      price: 299.99,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate empty DTO', async () => {
    const dto = plainToClass(UpdateProductDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when name is too short', async () => {
    const dto = plainToClass(UpdateProductDto, {
      name: 'a',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isLength).toContain(
      'Product name must be between 3 and 500 characters',
    );
  });

  it('should fail validation when price is negative', async () => {
    const dto = plainToClass(UpdateProductDto, {
      price: -10,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('price');
    expect(errors[0].constraints?.min).toContain(
      'Price must be greater than or equal to 0',
    );
  });

  it('should fail validation when stock is negative', async () => {
    const dto = plainToClass(UpdateProductDto, {
      stock: -5,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('stock');
    expect(errors[0].constraints?.min).toContain('Stock cannot be negative');
  });

  it('should not have categoryIds field', () => {
    const dto = new UpdateProductDto();
    expect(dto).not.toHaveProperty('categoryIds');
  });
});
