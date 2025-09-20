import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmCategoryRepository } from './repositories/typeorm-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: 'ICategoryRepository',
      useClass: TypeOrmCategoryRepository,
    },
  ],
  exports: [CategoriesService], // Export service for use in ProductsModule
})
export class CategoriesModule {}
