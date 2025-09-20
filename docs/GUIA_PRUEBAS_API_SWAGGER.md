# Guía de Pruebas de API - E-commerce Monolith Foundation

Esta guía te ayudará a probar todas las funcionalidades de la API usando **Swagger UI** y credenciales reales de la base de datos.

## 🚀 Acceso a Swagger UI

### Inicia la aplicación

```bash
npm run start:dev
```

### Accede a Swagger UI

Abre tu navegador en: http://localhost:3000/api

## 🔐 Credenciales de Prueba

Después de ejecutar `npm run seed`, puedes usar estas credenciales reales:

### Usuario Administrador

- **Email**: `admin@ecommerce.local`
- **Password**: `admin123`
- **Rol**: Administrador (acceso completo)

### Usuario Cliente

- **Email**: `customer@ecommerce.local`
- **Password**: `customer123`
- **Rol**: Cliente (acceso limitado)

## 📝 Flujo de Pruebas en Swagger

### 1. Autenticación

1. **Expande** la sección "Authentication" en Swagger
2. **Busca** el endpoint `POST /auth/login`
3. **Haz click** en "Try it out"
4. **Introduce** las credenciales:
   ```json
   {
     "email": "admin@ecommerce.local",
     "password": "admin123"
   }
   ```
5. **Ejecuta** la petición
6. **Copia** el `access_token` de la respuesta
7. **Haz click** en el botón "🔒 Authorize" (azul) en la parte superior
8. **Introduce** el token en formato: `Bearer {tu_access_token}`
9. **Haz click** en "Authorize"

### 2. Gestión de Categorías

#### Listar todas las categorías

- **Endpoint**: `GET /categories`
- **Descripción**: Obtiene todas las categorías disponibles
- **Autenticación**: No requerida

#### Crear nueva categoría (Solo Admin)

- **Endpoint**: `POST /categories`
- **Autenticación**: Requerida (Admin)
- **Datos de ejemplo**:
  ```json
  {
    "name": "Deportes",
    "description": "Artículos deportivos y fitness"
  }
  ```

### 3. Gestión de Productos

#### Listar productos

- **Endpoint**: `GET /products`
- **Parámetros opcionales**:
  - `page`: Número de página (por defecto: 1)
  - `limit`: Elementos por página (por defecto: 10)
  - `search`: Término de búsqueda
  - `categoryId`: ID de categoría para filtrar

#### Crear producto (Solo Admin)

- **Endpoint**: `POST /products`
- **Autenticación**: Requerida (Admin)
- **Datos de ejemplo**:
  ```json
  {
    "name": "Laptop Gaming",
    "description": "Laptop de alto rendimiento para gaming",
    "price": 1599.99,
    "stock": 5,
    "sku": "LPT-GAM-001",
    "categoryIds": ["ID_de_categoria_electronics"]
  }
  ```

### 4. Gestión de Usuarios (Solo Admin)

#### Listar usuarios

- **Endpoint**: `GET /users`
- **Autenticación**: Requerida (Admin)

#### Obtener perfil propio

- **Endpoint**: `GET /users/profile`
- **Autenticación**: Requerida

### 5. Analytics (Solo Admin)

#### Dashboard de analytics

- **Endpoint**: `GET /analytics/dashboard`
- **Autenticación**: Requerida (Admin)

#### Estadísticas de productos

- **Endpoint**: `GET /analytics/products`
- **Autenticación**: Requerida (Admin)

## 🔍 IDs Reales para Pruebas

Después del seeding, estos son algunos IDs que puedes usar:

### Categorías disponibles:

- **Electronics**: Busca en la respuesta de `GET /categories`
- **Clothing**: Busca en la respuesta de `GET /categories`
- **Books**: Busca en la respuesta de `GET /categories`
- **Home & Garden**: Busca en la respuesta de `GET /categories`

### Productos disponibles:

- **MacBook Pro 16"**: Busca en la respuesta de `GET /products`
- **iPhone 15 Pro**: Busca en la respuesta de `GET /products`
- **Premium Cotton T-Shirt**: Busca en la respuesta de `GET /products`

## 💡 Consejos para Pruebas

### 1. Orden recomendado de pruebas:

1. Login con credenciales de admin
2. Listar categorías para obtener IDs
3. Listar productos
4. Crear nueva categoría
5. Crear nuevo producto
6. Ver analytics

### 2. Manejo de errores:

- **401**: Token no válido o expirado
- **403**: Sin permisos (usuario no admin)
- **404**: Recurso no encontrado
- **422**: Datos de entrada no válidos

### 3. Renovación de token:

Los tokens tienen una duración limitada. Si recibes error 401, vuelve a hacer login.

### 4. Filtros y paginación:

Prueba diferentes parámetros en `GET /products`:

- `?page=1&limit=5` - Paginación
- `?search=MacBook` - Búsqueda por texto
- `?categoryId={electronics_id}` - Filtro por categoría

## 🎯 Casos de Prueba Específicos

### Caso 1: Crear producto completo

1. Autentica como admin
2. Obtén ID de categoría con `GET /categories`
3. Crea producto con `POST /products`
4. Verifica creación con `GET /products/{id}`

### Caso 2: Búsqueda y filtros

1. Lista productos con `GET /products`
2. Busca "iPhone" con `GET /products?search=iPhone`
3. Filtra por categoría electrónicos

### Caso 3: Gestión de permisos

1. Autentica como customer
2. Intenta crear producto (debe fallar con 403)
3. Autentica como admin
4. Crea producto exitosamente

## 🔧 Resolución de Problemas

### No puedo autenticarme:

- Verifica que la base de datos esté corriendo
- Ejecuta `npm run seed` para crear usuarios
- Usa exactamente: `admin@ecommerce.local` y `admin123`

### Error 500 en endpoints:

- Verifica que la base de datos esté conectada
- Revisa los logs en `logs/app-{fecha}.log`

### Token no funciona:

- Asegúrate de usar formato: `Bearer {token}`
- El token no debe incluir comillas
- Verifica que no haya espacios extra

## 📚 Recursos Adicionales

- **Logs de aplicación**: `logs/app-{fecha}.log`
- **Documentación de base de datos**: `docs/DATABASE_DESIGN.md`
- **ADRs**: `docs/adr/`
