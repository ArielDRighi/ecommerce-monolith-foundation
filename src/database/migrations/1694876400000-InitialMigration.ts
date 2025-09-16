import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1694876400000 implements MigrationInterface {
  name = 'InitialMigration1694876400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer',
        "first_name" character varying(255),
        "last_name" character varying(255),
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "email_verified_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user role enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'customer')
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "image_url" character varying(500),
        "sort_order" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "name" character varying(500) NOT NULL,
        "description" text,
        "slug" character varying(100) NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "sku" character varying(10),
        "images" jsonb,
        "attributes" jsonb,
        "rating" numeric(3,2),
        "review_count" integer NOT NULL DEFAULT 0,
        "view_count" integer NOT NULL DEFAULT 0,
        "order_count" integer NOT NULL DEFAULT 0,
        "created_by" uuid NOT NULL,
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id")
      )
    `);

    // Create product_categories junction table
    await queryRunner.query(`
      CREATE TABLE "product_categories" (
        "product_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_product_categories" PRIMARY KEY ("product_id", "category_id"),
        CONSTRAINT "FK_product_categories_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_categories_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    // Strategic indexes for performance

    // Users table indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email_unique" ON "users" ("email") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_role_active" ON "users" ("role") WHERE "is_active" = true
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_last_login" ON "users" ("last_login_at") WHERE "last_login_at" IS NOT NULL
    `);

    // Categories table indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_categories_slug_unique" ON "categories" ("slug") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_name_active" ON "categories" ("name") WHERE "is_active" = true
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_categories_sort_order" ON "categories" ("sort_order", "is_active")
    `);

    // Products table indexes
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_products_slug_unique" ON "products" ("slug") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_price_date_active" ON "products" ("price", "created_at") WHERE "is_active" = true
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_stock_active" ON "products" ("stock") WHERE "is_active" = true AND "stock" > 0
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_rating_active" ON "products" ("rating" DESC, "review_count" DESC) WHERE "is_active" = true AND "rating" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_popularity" ON "products" ("view_count" DESC, "order_count" DESC) WHERE "is_active" = true
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_created_by" ON "products" ("created_by") WHERE "is_active" = true
    `);

    // Full-text search index for products
    await queryRunner.query(`
      CREATE INDEX "IDX_products_fulltext_search" ON "products" 
      USING gin(to_tsvector('spanish', COALESCE("name", '') || ' ' || COALESCE("description", '')))
      WHERE "is_active" = true
    `);

    // Product categories junction table indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_product_categories_product" ON "product_categories" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_categories_category" ON "product_categories" ("category_id")
    `);

    // Create updated_at trigger function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Apply updated_at triggers
    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    await queryRunner.query(`
      CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON "categories"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    await queryRunner.query(`
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "products"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_products_updated_at ON "products"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_categories_updated_at ON "categories"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`,
    );

    // Drop trigger function
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column()`,
    );

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
