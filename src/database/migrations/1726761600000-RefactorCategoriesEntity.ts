import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCategoriesEntity1726761600000
  implements MigrationInterface
{
  name = 'RefactorCategoriesEntity1726761600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // STRATEGIC REFACTORING: Categories Entity Independence
    // ========================================

    // This migration reflects the refactoring performed in ADR-010
    // where we separated Categories from Products for better SRP compliance

    // 1. Ensure categories table has all required columns with proper constraints
    await queryRunner.query(`
      -- Add any missing columns from the Category entity
      ALTER TABLE "categories" 
      ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "metadata" JSON;
    `);

    // 2. Ensure proper constraints exist
    await queryRunner.query(`
      -- Ensure unique constraint on slug where not deleted
      DROP INDEX IF EXISTS "IDX_categories_slug_unique";
      CREATE UNIQUE INDEX "IDX_categories_slug_unique" 
      ON "categories" ("slug") 
      WHERE "deleted_at" IS NULL;
    `);

    // 3. Add optimized indexes for the independent Categories service
    await queryRunner.query(`
      -- Index for active categories lookup (used by CategoriesService)
      CREATE INDEX IF NOT EXISTS "IDX_categories_active_name" 
      ON "categories" ("is_active", "name") 
      WHERE "deleted_at" IS NULL;
    `);

    await queryRunner.query(`
      -- Index for sort order optimization
      CREATE INDEX IF NOT EXISTS "IDX_categories_sort_order" 
      ON "categories" ("sort_order", "is_active") 
      WHERE "deleted_at" IS NULL;
    `);

    // 4. Optimize product-categories relationship for the new architecture
    await queryRunner.query(`
      -- Ensure product_categories table has optimal structure
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "product_id" UUID NOT NULL,
        "category_id" UUID NOT NULL,
        CONSTRAINT "PK_product_categories" PRIMARY KEY ("product_id", "category_id"),
        CONSTRAINT "FK_product_categories_product" 
          FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_categories_category" 
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      );
    `);

    // 5. Add indexes for efficient many-to-many queries
    await queryRunner.query(`
      -- Index for finding products by category (CategoriesService.getProductsByCategory)
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_category_lookup" 
      ON "product_categories" ("category_id", "product_id");
    `);

    await queryRunner.query(`
      -- Index for finding categories by product (ProductsService queries)
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_product_lookup" 
      ON "product_categories" ("product_id", "category_id");
    `);

    // 6. Add categories metadata for enhanced functionality
    await queryRunner.query(`
      -- Add trigger for category updated_at (compatible syntax)
      DROP TRIGGER IF EXISTS "update_categories_updated_at" ON "categories";
      CREATE TRIGGER "update_categories_updated_at" 
      BEFORE UPDATE ON "categories" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // 7. Update table statistics for optimal query planning
    await queryRunner.query(`ANALYZE "categories"`);
    await queryRunner.query(`ANALYZE "product_categories"`);

    console.log('✅ Categories entity refactoring migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // ROLLBACK CATEGORIES REFACTORING
    // ========================================

    // Drop indexes created for the refactored Categories service
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_product_categories_product_lookup"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_product_categories_category_lookup"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_sort_order"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_categories_active_name"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_categories_slug_unique"`,
    );

    // Drop trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "update_categories_updated_at" ON "categories"`,
    );

    // Note: We don't remove the actual columns as they might contain data
    // and this could be a destructive operation. The columns remain for safety.

    console.log(
      '✅ Categories entity refactoring migration rollback completed',
    );
  }
}
