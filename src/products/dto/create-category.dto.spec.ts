import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateCategoryDto } from './create-category.dto';

describe('CreateCategoryDto', () => {
  it('should validate a valid category DTO', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Gaming Laptops',
      description: 'High-performance gaming laptops',
      slug: 'gaming-laptops',
      isActive: true,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when name is empty', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: '',
      slug: 'test-category',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isLength).toContain(
      'Category name must be between 2 and 255 characters',
    );
  });

  it('should fail validation when name is too long', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'a'.repeat(256),
      slug: 'test-category',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isLength).toContain(
      'Category name must be between 2 and 255 characters',
    );
  });

  it('should fail validation when slug is invalid', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'Invalid Slug!',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('slug');
    expect(errors[0].constraints?.matches).toContain(
      'Slug must contain only lowercase letters, numbers, and hyphens',
    );
  });

  it('should fail validation when slug is too short', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'a',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('slug');
    expect(errors[0].constraints?.isLength).toContain(
      'Slug must be between 2 and 100 characters',
    );
  });

  it('should fail validation when description is too long', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'test-category',
      description: 'a'.repeat(1001),
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('description');
    expect(errors[0].constraints?.isLength).toContain(
      'Description cannot exceed 1000 characters',
    );
  });

  it('should transform string boolean values correctly', () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'test-category',
      isActive: 'true',
    });

    expect(dto.isActive).toBe(true);

    const dto2 = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'test-category',
      isActive: 'false',
    });

    expect(dto2.isActive).toBe(false);
  });

  it('should allow valid slug patterns', async () => {
    const validSlugs = [
      'test-category',
      'gaming-laptops',
      'electronics-2024',
      'a-b-c-d',
      'category123',
    ];

    for (const slug of validSlugs) {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Test Category',
        slug,
      });

      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'slug')).toHaveLength(0);
    }
  });

  it('should set default value for isActive', () => {
    const dto = new CreateCategoryDto();
    expect(dto.isActive).toBe(true);
  });

  it('should handle optional description', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Test Category',
      slug: 'test-category',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.description).toBeUndefined();
  });
});
