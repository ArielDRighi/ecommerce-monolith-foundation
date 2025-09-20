import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmCategoryRepository } from './repositories/typeorm-category.repository';
import { DI_TOKENS } from '../common/tokens/di-tokens';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: DI_TOKENS.ICategoryRepository,
      useClass: TypeOrmCategoryRepository,
    },
  ],
  exports: [
    CategoriesService,
    {
      provide: DI_TOKENS.ICategoryRepository,
      useClass: TypeOrmCategoryRepository,
    },
  ], // Export service and repository for use in ProductsModule
})
export class CategoriesModule {}
