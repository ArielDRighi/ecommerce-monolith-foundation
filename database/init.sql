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
$$ language 'plpgsql';

-- Log de inicialización
SELECT 'Database initialized successfully' as status;