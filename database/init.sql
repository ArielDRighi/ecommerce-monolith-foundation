-- Inicialización de la base de datos
-- Este script se ejecuta automáticamente al crear el contenedor de PostgreSQL

-- Extensiones necesarias para UUIDs y búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuración de timezone
SET timezone = 'UTC';

-- Crear esquemas si es necesario (opcional, usando public por simplicidad)
-- CREATE SCHEMA IF NOT EXISTS catalog;

-- Configuración de búsqueda de texto en español
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS spanish_config (COPY = pg_catalog.spanish);

-- Función para timestamps automáticos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla de usuarios (para referencia)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    metadata JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku VARCHAR(10),
    images JSON,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    metadata JSON,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Tabla de relación productos-categorías
CREATE TABLE IF NOT EXISTS product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS IDX_categories_slug ON categories(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS IDX_categories_name_active ON categories(name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS IDX_categories_sort_order ON categories(sort_order);

-- Índices para productos (existentes mejorados)
CREATE INDEX IF NOT EXISTS IDX_products_name_search ON products(name);
CREATE INDEX IF NOT EXISTS IDX_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS IDX_products_price_date_active ON products(price, created_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS IDX_products_active_created ON products(is_active, created_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS IDX_products_rating ON products(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS IDX_products_stock ON products(stock) WHERE stock > 0;

-- Índices para relaciones
CREATE INDEX IF NOT EXISTS IDX_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS IDX_product_categories_category ON product_categories(category_id);

-- Triggers para updated_at (sintaxis compatible con PostgreSQL 9.1+)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales para categorías
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Electronics', 'electronics', 'Electronic devices and gadgets', 1),
('Books', 'books', 'Books and literature', 2),
('Clothing', 'clothing', 'Apparel and fashion', 3),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', 4),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 5)
ON CONFLICT (slug) DO NOTHING;

-- Log de inicialización
SELECT 'Database initialized successfully with categories support' as status;