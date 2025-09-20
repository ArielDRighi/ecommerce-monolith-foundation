import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { CategoriesModule } from '../categories/categories.module';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { DI_TOKENS } from '../common/tokens/di-tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    CategoriesModule, // Import to get CategoriesService
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: DI_TOKENS.IProductRepository,
      useClass: TypeOrmProductRepository,
    },
  ],
  exports: [ProductsService], // Export service for use in other modules if needed
})
export class ProductsModule {}
