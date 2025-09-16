import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('categories')
@Index(['slug'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['name'], { where: '"isActive" = true' })
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToMany('Product', 'categories')
  products: any[];

  // Virtual properties
  get productCount(): number {
    return this.products?.length || 0;
  }
}
