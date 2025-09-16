import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
