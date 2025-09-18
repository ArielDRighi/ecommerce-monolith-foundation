import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validation decorator to ensure maximum price is greater than or equal to minimum price
 *
 * Usage: Apply this decorator to the maxPrice property in DTOs that have both minPrice and maxPrice
 *
 * @param validationOptions - Standard class-validator options
 * @returns PropertyDecorator
 *
 * @example
 * ```typescript
 * class SearchDto {
 *   @IsOptional()
 *   @IsNumber()
 *   minPrice?: number;
 *
 *   @IsOptional()
 *   @IsNumber()
 *   @IsValidPriceRange()
 *   maxPrice?: number;
 * }
 * ```
 */
export function IsValidPriceRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidPriceRange',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const obj = args.object as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (obj.minPrice !== undefined && obj.maxPrice !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return obj.maxPrice >= obj.minPrice;
          }
          return true; // Valid if either is undefined
        },
        defaultMessage() {
          return 'Maximum price must be greater than or equal to minimum price';
        },
      },
    });
  };
}
