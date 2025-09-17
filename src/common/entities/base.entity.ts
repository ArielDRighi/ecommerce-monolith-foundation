import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

/**
 * Base entity with common fields for all entities
 * Provides UUID primary key, timestamps and soft delete functionality
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Virtual getter to check if entity has been soft deleted
   */
  get isDeleted(): boolean {
    return this.deletedAt !== undefined && this.deletedAt !== null;
  }

  /**
   * Virtual getter to check if entity was created recently (within last day)
   */
  get isRecent(): boolean {
    if (!this.createdAt) return false;
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return this.createdAt > dayAgo;
  }
}
