import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateCategoryDto } from './update-category.dto';

describe('UpdateCategoryDto', () => {
  it('should validate a valid update category DTO', async () => {
    const dto = plainToClass(UpdateCategoryDto, {
      name: 'Updated Category',
      description: 'Updated description',
      slug: 'updated-category',
      isActive: false,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when updating only name', async () => {
    const dto = plainToClass(UpdateCategoryDto, {
      name: 'New Category Name',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate when updating only slug', async () => {
    const dto = plainToClass(UpdateCategoryDto, {
      slug: 'new-category-slug',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate empty DTO', async () => {
    const dto = plainToClass(UpdateCategoryDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when name is too short', async () => {
    const dto = plainToClass(UpdateCategoryDto, {
      name: 'a',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isLength).toContain(
      'Category name must be between 2 and 255 characters',
    );
  });

  it('should fail validation when slug is invalid', async () => {
    const dto = plainToClass(UpdateCategoryDto, {
      slug: 'Invalid Slug!',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('slug');
    expect(errors[0].constraints?.matches).toContain(
      'Slug must contain only lowercase letters, numbers, and hyphens',
    );
  });

  it('should transform boolean values correctly', () => {
    const dto = plainToClass(UpdateCategoryDto, {
      isActive: 'false',
    });

    expect(dto.isActive).toBe(false);
  });
});
