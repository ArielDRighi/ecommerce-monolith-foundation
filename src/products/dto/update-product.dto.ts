import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['categoryIds'] as const),
) {
  // All fields from CreateProductDto become optional
  // categoryIds is omitted because category updates should be handled separately
}
