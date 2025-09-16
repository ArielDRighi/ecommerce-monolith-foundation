import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1726502400000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1726502400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // PHASE 1: STRATEGIC COMPOSITE INDEXES
    // ========================================

    // Primary search optimization - covers most common search patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_search_optimized" 
      ON "products" ("is_active", "price", "stock", "created_at") 
      WHERE "deleted_at" IS NULL
    `);

    // Category-based filtering with performance optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_category_active" 
      ON "products" ("is_active", "created_at") 
      WHERE "deleted_at" IS NULL AND "stock" > 0
    `);

    // Price range filtering with active products
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_price_range" 
      ON "products" ("price", "is_active", "stock") 
      WHERE "deleted_at" IS NULL
    `);

    // ========================================
    // PHASE 2: FULL-TEXT SEARCH INDEXES
    // ========================================

    // Enable trigram extension for partial matching
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Full-text search index for name and description (Spanish language)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_fulltext_search" 
      ON "products" USING gin(
        to_tsvector('spanish', 
          coalesce("name", '') || ' ' || coalesce("description", '')
        )
      ) 
      WHERE "deleted_at" IS NULL AND "is_active" = true
    `);

    // Trigram index for partial name matching (for autocomplete)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_name_trigram" 
      ON "products" USING gin("name" gin_trgm_ops) 
      WHERE "deleted_at" IS NULL AND "is_active" = true
    `);

    // ========================================
    // PHASE 3: SORTING & POPULARITY INDEXES
    // ========================================

    // Popularity sorting optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_popularity" 
      ON "products" ("is_active", "order_count", "view_count", "rating", "created_at") 
      WHERE "deleted_at" IS NULL AND "stock" > 0
    `);

    // Rating-based filtering and sorting
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_rating_sort" 
      ON "products" ("rating", "is_active", "review_count") 
      WHERE "deleted_at" IS NULL AND "rating" IS NOT NULL
    `);

    // Stock availability optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_stock_available" 
      ON "products" ("stock", "is_active", "updated_at") 
      WHERE "deleted_at" IS NULL AND "stock" > 0
    `);

    // ========================================
    // PHASE 4: MANY-TO-MANY RELATIONSHIP OPTIMIZATION
    // ========================================

    // Product-Category junction table optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_categories_lookup" 
      ON "product_categories" ("category_id", "product_id")
    `);

    // Reverse lookup for categories
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_categories_reverse" 
      ON "product_categories" ("product_id", "category_id")
    `);

    // ========================================
    // PHASE 5: CATEGORY OPTIMIZATION
    // ========================================

    // Category active lookup optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_categories_active_sort" 
      ON "categories" ("is_active", "sort_order", "name") 
      WHERE "deleted_at" IS NULL
    `);

    // Category slug optimization (already exists but ensuring it's optimal)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_categories_slug_unique_new" 
      ON "categories" ("slug") 
      WHERE "deleted_at" IS NULL
    `);

    // ========================================
    // PHASE 6: ADMIN OPERATIONS OPTIMIZATION
    // ========================================

    // SKU lookup optimization for admin operations
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_sku_lookup" 
      ON "products" ("sku") 
      WHERE "deleted_at" IS NULL AND "sku" IS NOT NULL
    `);

    // Created by user optimization for admin queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_products_created_by" 
      ON "products" ("created_by", "created_at", "is_active") 
      WHERE "deleted_at" IS NULL
    `);

    // ========================================
    // QUERY OPTIMIZATION HINTS
    // ========================================

    // Update table statistics for better query planning
    await queryRunner.query(`ANALYZE "products"`);
    await queryRunner.query(`ANALYZE "categories"`);
    await queryRunner.query(`ANALYZE "product_categories"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // ROLLBACK ALL PERFORMANCE INDEXES
    // ========================================

    // Drop all created indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_created_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_sku_lookup"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_categories_slug_unique_new"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_categories_active_sort"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_product_categories_reverse"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_product_categories_lookup"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_products_stock_available"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_rating_sort"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_popularity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_name_trigram"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_products_fulltext_search"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_price_range"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_products_category_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_products_search_optimized"`,
    );

    // Note: We don't drop pg_trgm extension as it might be used elsewhere
    // await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}
