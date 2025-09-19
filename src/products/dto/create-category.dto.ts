import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Gaming Laptops',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @Length(2, 255, {
    message: 'Category name must be between 2 and 255 characters',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'High-performance gaming laptops and notebooks',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000, {
    message: 'Description cannot exceed 1000 characters',
  })
  description?: string;

  @ApiProperty({
    description: 'Category slug (URL-friendly name)',
    example: 'gaming-laptops',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @Length(2, 100, {
    message: 'Slug must be between 2 and 100 characters',
  })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active and visible',
    example: true,
    default: true,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean = true;
}
