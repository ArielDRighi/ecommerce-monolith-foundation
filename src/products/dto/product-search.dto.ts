import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsUUID,
  IsEnum,
  Min,
  Max,
  Length,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductSortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  POPULARITY = 'popularity', // orderCount
  VIEWS = 'viewCount',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// Custom validation decorator for price range
function IsValidPriceRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidPriceRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as ProductSearchDto;
          if (obj.minPrice !== undefined && obj.maxPrice !== undefined) {
            return obj.maxPrice >= obj.minPrice;
          }
          return true; // Valid if either is undefined
        },
        defaultMessage(args: ValidationArguments) {
          return 'Maximum price must be greater than or equal to minimum price';
        },
      },
    });
  };
}

export class ProductSearchDto {
  @ApiPropertyOptional({
    description: 'Search term for product name or description',
    example: 'gaming laptop',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, {
    message: 'Search term must be between 1 and 255 characters',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Category ID to filter products',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum price must be a number' })
  @Min(0, { message: 'Minimum price cannot be negative' })
  @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 2000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maximum price must be a number' })
  @Min(0, { message: 'Maximum price cannot be negative' })
  @IsValidPriceRange()
  @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter only products in stock',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum rating filter (0-5)',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum rating must be a number' })
  @Min(0, { message: 'Rating cannot be less than 0' })
  @Max(5, { message: 'Rating cannot be greater than 5' })
  @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ProductSortBy,
    example: ProductSortBy.PRICE,
    default: ProductSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortBy, { message: 'Invalid sort field' })
  sortBy?: ProductSortBy = ProductSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be ASC or DESC' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number = 20;
}
