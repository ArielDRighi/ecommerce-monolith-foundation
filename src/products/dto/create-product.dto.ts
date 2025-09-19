import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
  Max,
  Length,
  Matches,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Gaming Laptop ASUS ROG Strix',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @Length(3, 500, {
    message: 'Product name must be between 3 and 500 characters',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'High-performance gaming laptop with RTX 4070 and 32GB RAM',
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: 'Description cannot exceed 2000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Product slug (URL-friendly name)',
    example: 'gaming-laptop-asus-rog-strix',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @Length(3, 100, { message: 'Slug must be between 3 and 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    description: 'Product price in USD',
    example: 1299.99,
    minimum: 0,
    maximum: 999999.99,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with maximum 2 decimal places' },
  )
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  @Max(999999.99, { message: 'Price cannot exceed $999,999.99' })
  @Transform(({ value }) => parseFloat(String(value)))
  price: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
    minimum: 0,
  })
  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock cannot be negative' })
  @Transform(({ value }) => parseInt(String(value), 10))
  stock: number;

  @ApiPropertyOptional({
    description: 'Product SKU (Stock Keeping Unit)',
    example: 'ASUS-001',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10, { message: 'SKU must be between 1 and 10 characters' })
  sku?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: [
      'https://example.com/laptop-front.jpg',
      'https://example.com/laptop-side.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each image must be a valid string URL' })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product attributes as key-value pairs',
    example: {
      brand: 'ASUS',
      processor: 'Intel i7-13700H',
      memory: '32GB DDR5',
      storage: '1TB NVMe SSD',
      graphics: 'RTX 4070 8GB',
      screen: '15.6" QHD 165Hz',
      weight: '2.3kg',
    },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({
    description:
      'Array of category IDs to associate with the product. ' +
      'Available categories: Electronics (902eaa28-87c4-4722-a7dd-dcbf8800aa31), ' +
      'Clothing (c2443eb1-ed52-4538-853d-6915f2e8d547), ' +
      'Books (03f6b39c-c286-4c05-a7ec-5d06427d5e71), ' +
      'Home & Garden (bb62ab92-48c3-408c-a8bb-634f157e0eca)',
    example: ['902eaa28-87c4-4722-a7dd-dcbf8800aa31'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Product must belong to at least one category' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  categoryIds: string[];

  @ApiPropertyOptional({
    description: 'Whether the product is active and visible',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean = true;
}
