import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

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

export class CreatedByUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'admin@example.com',
  })
  @Expose()
  email: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @Expose()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @Expose()
  lastName?: string;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Laptop Gaming ASUS ROG',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-performance gaming laptop with RTX 4070 and 32GB RAM',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'laptop-gaming-asus-rog-2024',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Product price in USD',
    example: 1299.99,
  })
  @Expose()
  price: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
  })
  @Expose()
  stock: number;

  @ApiPropertyOptional({
    description: 'Product SKU',
    example: 'ASUS-ROG-2024-001',
  })
  @Expose()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: [
      'https://example.com/laptop-front.jpg',
      'https://example.com/laptop-side.jpg',
    ],
    type: [String],
  })
  @Expose()
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product attributes',
    example: {
      brand: 'ASUS',
      processor: 'Intel i7-13700H',
      memory: '32GB DDR5',
    },
  })
  @Expose()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Product rating (0-5)',
    example: 4.5,
  })
  @Expose()
  rating?: number;

  @ApiProperty({
    description: 'Number of reviews',
    example: 127,
  })
  @Expose()
  reviewCount: number;

  @ApiProperty({
    description: 'Number of views',
    example: 1250,
  })
  @Expose()
  viewCount: number;

  @ApiProperty({
    description: 'Number of orders',
    example: 45,
  })
  @Expose()
  orderCount: number;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Product categories',
    type: [CategoryResponseDto],
  })
  @Expose()
  @Type(() => CategoryResponseDto)
  categories: CategoryResponseDto[];

  @ApiProperty({
    description: 'User who created the product',
    type: CreatedByUserDto,
  })
  @Expose()
  @Type(() => CreatedByUserDto)
  createdBy: CreatedByUserDto;

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

  // Virtual properties
  @ApiProperty({
    description: 'Whether the product is in stock',
    example: true,
  })
  @Expose()
  get isInStock(): boolean {
    return this.stock > 0;
  }

  @ApiProperty({
    description: 'Whether the product has low stock (≤10)',
    example: false,
  })
  @Expose()
  get isLowStock(): boolean {
    return this.stock > 0 && this.stock <= 10;
  }

  @ApiProperty({
    description: 'Average rating with fallback to 0',
    example: 4.5,
  })
  @Expose()
  get averageRating(): number {
    return this.rating || 0;
  }
}
