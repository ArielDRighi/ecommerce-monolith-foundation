import { Entity, Column, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Entity('users')
@Index(['email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['role'], { where: '"is_active" = true' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'last_login_at',
  })
  lastLoginAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'email_verified_at',
  })
  emailVerifiedAt?: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.createdBy)
  products: Product[];

  // Virtual fields
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isCustomer(): boolean {
    return this.role === UserRole.CUSTOMER;
  }
}
