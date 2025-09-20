import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Laptops',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'High-performance laptops and notebooks',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Category slug',
    example: 'laptops',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
