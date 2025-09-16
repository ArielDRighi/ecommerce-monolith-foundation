# 📊 Análisis de Consultas - Sistema de Productos E-commerce

## 🎯 **Objetivo**

Identificar y optimizar las consultas más frecuentes y críticas del sistema de productos para garantizar performance enterprise.

## 📈 **Consultas Críticas Identificadas**

### **1. Búsqueda Principal de Productos (Más Frecuente)**

```sql
-- Consulta actual generada por ProductsService.searchProducts()
SELECT product.*, category.*, "createdBy".*
FROM products product
LEFT JOIN product_categories pc ON pc.product_id = product.id
LEFT JOIN categories category ON category.id = pc.category_id
LEFT JOIN users "createdBy" ON "createdBy".id = product.created_by
WHERE product.deletedAt IS NULL
  AND product.isActive = true
  AND (product.name ILIKE '%search_term%' OR product.description ILIKE '%search_term%')
  AND category.id = :categoryId
  AND product.price >= :minPrice
  AND product.price <= :maxPrice
  AND product.stock > 0
ORDER BY product.price DESC, product.createdAt DESC
LIMIT 20 OFFSET 0;
```

**Problemas de Performance:**

- ❌ `ILIKE '%term%'` es extremadamente lento (no usa índices)
- ❌ Join múltiple sin índices optimizados
- ❌ WHERE con múltiples condiciones sin índice compuesto
- ❌ ORDER BY en campos no indexados conjuntamente

### **2. Filtrado por Categoría (Muy Frecuente)**

```sql
-- Productos por categoría específica
SELECT product.*, category.*
FROM products product
JOIN product_categories pc ON pc.product_id = product.id
JOIN categories category ON category.id = pc.category_id
WHERE product.isActive = true
  AND product.deletedAt IS NULL
  AND category.id = :categoryId
ORDER BY product.createdAt DESC;
```

**Problemas:**

- ❌ Join en tabla many-to-many sin índices optimizados
- ❌ Combinación isActive + deletedAt sin índice compuesto

### **3. Ordenamiento por Precio (Frecuente)**

```sql
-- Productos ordenados por precio
SELECT * FROM products
WHERE isActive = true AND deletedAt IS NULL
ORDER BY price ASC/DESC, createdAt DESC;
```

**Problemas:**

- ❌ ORDER BY en múltiples campos sin índice compuesto

### **4. Búsqueda de Texto Completo (Creciente)**

```sql
-- Búsqueda en nombre y descripción
SELECT * FROM products
WHERE (name ILIKE '%gaming%' OR description ILIKE '%gaming%')
  AND isActive = true;
```

**Problemas:**

- ❌ Sin índice full-text search
- ❌ ILIKE con wildcard inicial no usa índices

### **5. Filtros de Stock y Rating (Comunes)**

```sql
-- Productos disponibles con rating alto
SELECT * FROM products
WHERE stock > 0
  AND rating >= 4.0
  AND isActive = true
ORDER BY rating DESC, orderCount DESC;
```

**Problemas:**

- ❌ Múltiples condiciones sin índice compuesto
- ❌ ORDER BY en campos no indexados juntos

## 🎯 **Patrones de Acceso Identificados**

### **Consultas Más Frecuentes (80/20 Rule):**

1. **Búsqueda con filtros** (40% del tráfico)
2. **Listado por categoría** (25% del tráfico)
3. **Ordenamiento por precio** (15% del tráfico)
4. **Productos en stock** (10% del tráfico)
5. **Búsqueda full-text** (10% del tráfico)

### **Combinaciones Críticas:**

- `name/description + categoryId + price + stock`
- `categoryId + isActive + deletedAt + createdAt`
- `isActive + stock + rating + orderCount`
- `price + isActive + deletedAt`

## 🚀 **Estrategia de Optimización**

### **Fase 1: Índices Compuestos Estratégicos**

```sql
-- Índice principal para búsqueda con filtros
CREATE INDEX CONCURRENTLY idx_products_search_optimized
ON products (isActive, category_id, price, stock)
WHERE deletedAt IS NULL;

-- Índice para ordenamiento por precio
CREATE INDEX CONCURRENTLY idx_products_price_active
ON products (isActive, price, createdAt)
WHERE deletedAt IS NULL;

-- Índice para búsqueda por categoría
CREATE INDEX CONCURRENTLY idx_product_categories_active
ON product_categories (category_id, product_id)
INCLUDE (created_at);
```

### **Fase 2: Full-Text Search**

```sql
-- Índice GIN para búsqueda de texto
CREATE INDEX CONCURRENTLY idx_products_fulltext_search
ON products USING gin(to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Índice trigram para búsquedas parciales
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_products_name_trgm
ON products USING gin(name gin_trgm_ops);
```

### **Fase 3: Índices de Performance**

```sql
-- Índice para productos populares
CREATE INDEX CONCURRENTLY idx_products_popularity
ON products (isActive, rating, orderCount, viewCount)
WHERE deletedAt IS NULL AND stock > 0;

-- Índice para stock disponible
CREATE INDEX CONCURRENTLY idx_products_available_stock
ON products (stock, isActive, createdAt)
WHERE deletedAt IS NULL AND stock > 0;
```

## 📊 **Métricas a Mejorar**

### **Performance Targets:**

- ✅ Búsqueda simple: `< 50ms` (actual: ~200-500ms)
- ✅ Búsqueda con filtros: `< 100ms` (actual: ~300-800ms)
- ✅ Listado por categoría: `< 30ms` (actual: ~150-300ms)
- ✅ Ordenamiento: `< 25ms` (actual: ~100-250ms)

### **Escalabilidad Targets:**

- ✅ Soportar 100k+ productos sin degradación
- ✅ Manejar 1000+ consultas concurrentes
- ✅ Mantener performance con datasets de 1M+ productos

## 🧪 **Plan de Testing**

### **Dataset de Prueba:**

- 10,000 productos con distribución realista
- 50 categorías con relaciones many-to-many
- Datos de rating, stock, y popularity variables

### **Benchmarks:**

1. Queries sin índices (baseline)
2. Queries con índices básicos (actual)
3. Queries con índices optimizados (target)
4. Queries con dataset grande (stress test)

### **Métricas a Capturar:**

- Tiempo de ejecución promedio
- Plan de ejecución de PostgreSQL
- Uso de CPU y memoria
- Throughput de consultas concurrentes

---

## ✅ **Próximos Pasos**

1. **Crear migrations** con índices estratégicos
2. **Implementar full-text search** en ProductsService
3. **Generar dataset** de 10k productos para testing
4. **Crear herramientas** de benchmark
5. **Documentar resultados** de performance

**Resultado Esperado:** Sistema que escale de forma empresarial con consultas sub-100ms incluso con millones de productos.
