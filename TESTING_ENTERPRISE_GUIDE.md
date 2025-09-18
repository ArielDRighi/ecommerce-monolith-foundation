# 🧪 **GUÍA MASTER: IMPLEMENTACIÓN DE TESTING ENTERPRISE COMPLETO**

> **Guía sistemática para implementar testing enterprise de calidad en cualquier aplicación NestJS/Node.js**

---

## **🚨 LECCIONES APRENDIDAS - ERRORES COMUNES A EVITAR**

### **❌ Errores Típicos al Implementar Testing:**

1. **Saltar la investigación inicial**
   - Crear tests sin entender la arquitectura real
   - Asumir DTOs, endpoints y respuestas sin verificar
   - No investigar la configuración de testing existente

2. **Empezar con tests demasiado complejos**
   - Intentar E2E enterprise sin tener unitarios básicos
   - Mezclar múltiples tipos de testing simultáneamente
   - Tests avanzados sin fundación sólida

3. **Falta de contexto sobre la aplicación**
   - No conocer endpoints exactos ni estructura de respuestas
   - No entender las validaciones y transformaciones de DTOs
   - No mapear flujos de negocio reales

### **✅ Approach Correcto:**

**INVESTIGACIÓN PRIMERO → TESTS BÁSICOS → EXPANSIÓN GRADUAL → ENTERPRISE FEATURES**

---

## **PARTE 1: INVESTIGACIÓN OBLIGATORIA** 🔍

> ⚠️ **CRÍTICO:** Ejecutar esta investigación ANTES de escribir cualquier test

### **1.1 Auditoría de Arquitectura de la Aplicación**

````markdown
## Investigación de Arquitectura

### Mapeo de Entidades y Relaciones

- [ ] Listar TODAS las entidades de la aplicación
- [ ] Documentar relaciones entre entidades (OneToMany, ManyToMany, etc.)
- [ ] Identificar campos requeridos vs opcionales
- [ ] Mapear validaciones a nivel de base de datos (constraints, indexes)

### Estructura de Módulos

- [ ] Documentar estructura de carpetas y módulos
- [ ] Identificar patrones arquitectónicos (Repository, Service, Controller)
- [ ] Mapear dependencias entre módulos
- [ ] Verificar inyección de dependencias

### Ejemplo de Documentación:

```typescript
// Entidades Principales:
User: { id, email, password, firstName, lastName, role, createdAt, updatedAt }
Product: { id, name, description, slug, price, stock, sku, images, attributes, categoryIds, isActive }
Category: { id, name, description, slug, isActive }

// Relaciones:
User (1) -> (N) Product (createdBy)
Product (N) <-> (M) Category
```
````

### **1.2 Mapeo Completo de APIs**

````markdown
## Auditoría de Endpoints

### Endpoints de Autenticación

- [ ] POST /api/v1/auth/register - Registro de usuarios
- [ ] POST /api/v1/auth/login - Login con JWT
- [ ] GET /api/v1/auth/profile - Perfil protegido
- [ ] POST /api/v1/auth/refresh - Renovación de tokens
- [ ] POST /api/v1/auth/logout - Logout

### Endpoints de Productos (Admin)

- [ ] POST /api/v1/products - Crear producto (ADMIN only)
- [ ] PATCH /api/v1/products/:id - Actualizar producto (ADMIN only)
- [ ] DELETE /api/v1/products/:id - Eliminar producto (ADMIN only)
- [ ] GET /api/v1/products/:id - Obtener producto específico

### Endpoints Públicos

- [ ] GET /api/v1/products/search - Búsqueda pública con filtros
- [ ] GET /api/v1/products/popular - Productos populares
- [ ] GET /api/v1/products/recent - Productos recientes

### Estructura de Respuestas

```typescript
// Respuesta estándar exitosa:
{
  "id": "uuid",
  "name": "string",
  "price": number,
  // ... campos específicos
}

// Respuesta de error:
{
  "statusCode": number,
  "message": string | string[],
  "error": "string"
}

// Respuesta de búsqueda paginada:
{
  "data": Array<T>,
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}
```
````

### **1.3 Análisis de DTOs y Validaciones**

```markdown
## Auditoría de DTOs

### DTOs de Entrada

- [ ] CreateUserDto: validaciones de email, password, nombres
- [ ] LoginDto: validaciones básicas
- [ ] CreateProductDto: validaciones de precio, stock, categorías
- [ ] ProductSearchDto: validaciones de filtros y paginación

### DTOs de Salida

- [ ] UserResponseDto: campos expuestos vs omitidos
- [ ] ProductResponseDto: transformaciones aplicadas
- [ ] AuthResponseDto: estructura de tokens

### Validaciones Críticas

- [ ] Validaciones de UUID en parámetros
- [ ] Validaciones de roles y permisos
- [ ] Validaciones de rangos (precios, paginación)
- [ ] Transformaciones automáticas (numbers, booleans)
```

### **1.4 Configuración de Testing Actual**

```markdown
## Auditoría de Configuración de Testing

### Configuración Jest

- [ ] Verificar jest.config.js o package.json
- [ ] Configuración de paths y moduleNameMapping
- [ ] Setup de testing environment (node/jsdom)
- [ ] Configuración de coverage

### Base de Datos de Testing

- [ ] Verificar configuración de DB de testing (.env.test)
- [ ] Extensiones necesarias (pg_trgm, uuid-ossp)
- [ ] Scripts de inicialización y cleanup
- [ ] Configuración de transacciones para tests

### Tests Existentes

- [ ] Ejecutar tests actuales y documentar resultados
- [ ] Identificar patterns de success vs failure
- [ ] Verificar setup/teardown de tests
- [ ] Analizar helpers y utilities existentes
```

---

## **PARTE 2: ESTRATEGIA DE TESTING PROGRESIVA** 📈

### **2.1 Foundation: Tests Unitarios**

#### **Nivel 1 - Servicios Core (Sin Dependencias Externas)**

```typescript
// Ejemplo: AuthService - Métodos Puros
describe('AuthService - Utility Methods', () => {
  it('should hash password correctly', async () => {
    const password = 'testPassword123';
    const hashedPassword = await authService.hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(await bcrypt.compare(password, hashedPassword)).toBe(true);
  });

  it('should validate password format', () => {
    expect(authService.validatePasswordFormat('weak')).toBe(false);
    expect(authService.validatePasswordFormat('StrongPass123!')).toBe(true);
  });
});
```

#### **Nivel 2 - Servicios con Dependencias (Con Mocks)**

```typescript
// Ejemplo: ProductsService con Repository Mock
describe('ProductsService - Business Logic', () => {
  let productsService: ProductsService;
  let mockProductRepository: jest.Mocked<Repository<Product>>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    mockProductRepository = module.get(getRepositoryToken(Product));
  });

  it('should create product with valid data', async () => {
    const createProductDto = {
      name: 'Test Product',
      price: 99.99,
      stock: 10,
      categoryIds: ['uuid1'],
    };

    mockProductRepository.create.mockReturnValue(mockProduct);
    mockProductRepository.save.mockResolvedValue(mockProduct);

    const result = await productsService.createProduct(
      createProductDto,
      mockUser,
    );

    expect(mockProductRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: createProductDto.name,
        price: createProductDto.price,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: createProductDto.name,
      }),
    );
  });
});
```

#### **Nivel 3 - Guards y Middlewares**

```typescript
// Ejemplo: JwtAuthGuard
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;

  it('should allow access with valid JWT', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer valid-jwt-token' },
      user: { id: 'user-id', role: 'ADMIN' },
    };

    mockExecutionContext.switchToHttp.mockReturnValue({
      getRequest: () => mockRequest,
    });

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should deny access without JWT', async () => {
    const mockRequest = { headers: {} };

    mockExecutionContext.switchToHttp.mockReturnValue({
      getRequest: () => mockRequest,
    });

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();
  });
});
```

### **2.2 Integration Tests**

#### **Nivel 1 - Repository Integration**

```typescript
// Ejemplo: Repository con DB Real
describe('ProductRepository Integration', () => {
  let productRepository: Repository<Product>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  it('should save and retrieve product with relations', async () => {
    const category = await queryRunner.manager.save(Category, {
      name: 'Test Category',
      slug: 'test-category',
    });

    const product = await queryRunner.manager.save(Product, {
      name: 'Test Product',
      slug: 'test-product',
      price: 99.99,
      stock: 10,
      categories: [category],
    });

    const retrievedProduct = await queryRunner.manager.findOne(Product, {
      where: { id: product.id },
      relations: ['categories'],
    });

    expect(retrievedProduct).toBeDefined();
    expect(retrievedProduct.categories).toHaveLength(1);
    expect(retrievedProduct.categories[0].name).toBe('Test Category');
  });
});
```

#### **Nivel 2 - Service Integration**

```typescript
// Ejemplo: Servicios con DB Real
describe('ProductsService Integration', () => {
  let productsService: ProductsService;
  let testUser: User;

  beforeEach(async () => {
    testUser = await userRepository.save({
      email: 'test@integration.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
  });

  it('should create product and persist to database', async () => {
    const createProductDto = {
      name: 'Integration Test Product',
      slug: 'integration-test-product',
      description: 'Product for integration testing',
      price: 199.99,
      stock: 50,
      categoryIds: [],
    };

    const createdProduct = await productsService.createProduct(
      createProductDto,
      testUser,
    );

    expect(createdProduct.id).toBeDefined();
    expect(createdProduct.name).toBe(createProductDto.name);

    // Verificar que se persistió en DB
    const dbProduct = await productRepository.findOne({
      where: { id: createdProduct.id },
    });
    expect(dbProduct).toBeDefined();
    expect(dbProduct.name).toBe(createProductDto.name);
  });
});
```

#### **Nivel 3 - Controller Integration**

```typescript
// Ejemplo: Controller con request real
describe('ProductsController Integration', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Obtener token de admin
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    adminToken = loginResponse.body.access_token;
  });

  it('should create product via API', async () => {
    const productData = {
      name: 'API Test Product',
      slug: 'api-test-product',
      price: 299.99,
      stock: 25,
      categoryIds: [],
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(productData.name);
  });
});
```

### **2.3 End-to-End Tests**

#### **Nivel 1 - Happy Paths**

```typescript
// Ejemplo: Flujo completo de usuario
describe('E2E - Complete User Journey', () => {
  let app: INestApplication;

  it('should complete full admin workflow', async () => {
    // 1. Registro de admin
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@e2e.com',
        password: 'AdminPass123!',
        firstName: 'Admin',
        lastName: 'User',
      })
      .expect(201);

    // 2. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@e2e.com',
        password: 'AdminPass123!',
      })
      .expect(200);

    const token = loginResponse.body.access_token;

    // 3. Crear categoría
    const categoryResponse = await request(app.getHttpServer())
      .post('/api/v1/products/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Category',
        slug: 'e2e-category',
        description: 'Category for E2E testing',
      })
      .expect(201);

    // 4. Crear producto
    const productResponse = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Product',
        slug: 'e2e-product',
        price: 99.99,
        stock: 100,
        categoryIds: [categoryResponse.body.id],
      })
      .expect(201);

    // 5. Búsqueda pública (sin auth)
    const searchResponse = await request(app.getHttpServer())
      .get('/api/v1/products/search')
      .query({ search: 'E2E', limit: 10 })
      .expect(200);

    expect(searchResponse.body.data).toHaveLength(1);
    expect(searchResponse.body.data[0].name).toBe('E2E Product');
  });
});
```

#### **Nivel 2 - Business Flows Complejos**

```typescript
// Ejemplo: Flujos de negocio con múltiples operaciones
describe('E2E - Complex Business Flows', () => {
  it('should handle bulk product operations', async () => {
    // Crear múltiples productos
    const products = [];
    for (let i = 1; i <= 10; i++) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Bulk Product ${i}`,
          slug: `bulk-product-${i}`,
          price: i * 10,
          stock: i * 5,
          categoryIds: [testCategoryId],
        })
        .expect(201);

      products.push(response.body);
    }

    // Búsqueda con filtros
    const searchResponse = await request(app.getHttpServer())
      .get('/api/v1/products/search')
      .query({
        search: 'Bulk Product',
        minPrice: 50,
        maxPrice: 100,
        limit: 20,
      })
      .expect(200);

    expect(searchResponse.body.data.length).toBeGreaterThanOrEqual(5);

    // Actualización masiva
    for (const product of products.slice(0, 5)) {
      await request(app.getHttpServer())
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 0 })
        .expect(200);
    }

    // Verificar productos sin stock
    const outOfStockSearch = await request(app.getHttpServer())
      .get('/api/v1/products/search')
      .query({ inStock: false })
      .expect(200);

    expect(outOfStockSearch.body.data.length).toBeGreaterThanOrEqual(5);
  });
});
```

#### **Nivel 3 - Security y Error Handling**

```typescript
// Ejemplo: Validación de seguridad y errores
describe('E2E - Security and Error Handling', () => {
  it('should prevent unauthorized access', async () => {
    // Intentar crear producto sin token
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .send({
        name: 'Unauthorized Product',
        slug: 'unauthorized-product',
        price: 99.99,
        stock: 10,
      })
      .expect(401);

    // Intentar con token de customer
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Customer Product',
        slug: 'customer-product',
        price: 99.99,
        stock: 10,
      })
      .expect(403);
  });

  it('should handle SQL injection attempts', async () => {
    const maliciousQueries = [
      "'; DROP TABLE products; --",
      "' OR '1'='1",
      "'; UPDATE products SET price = 0; --",
    ];

    for (const maliciousQuery of maliciousQueries) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({ search: maliciousQuery })
        .expect(200);

      // Should return empty results, not execute malicious SQL
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });
});
```

---

## **PARTE 3: TESTING ENTERPRISE AVANZADO** 🚀

### **3.1 Contract Testing**

```typescript
// Ejemplo: Contract testing entre módulos
describe('Contract Testing - Products <-> Auth', () => {
  it('should maintain auth contract for product creation', async () => {
    const authContract = {
      user: {
        id: expect.any(String),
        role: expect.stringMatching(/^(ADMIN|CUSTOMER)$/),
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
      },
    };

    const mockUser = {
      id: 'uuid-string',
      role: 'ADMIN',
      email: 'test@contract.com',
    };

    // Verificar que ProductsService acepta el contrato
    const productDto = {
      name: 'Contract Test Product',
      slug: 'contract-test-product',
      price: 99.99,
      stock: 10,
      categoryIds: [],
    };

    expect(() => {
      productsService.createProduct(productDto, mockUser);
    }).not.toThrow();

    // Verificar estructura de respuesta
    const result = await productsService.createProduct(productDto, mockUser);
    expect(result).toMatchObject({
      id: expect.any(String),
      name: productDto.name,
      createdBy: expect.objectContaining(authContract.user),
    });
  });
});
```

### **3.2 Performance Testing**

```typescript
// Ejemplo: Performance testing con métricas
describe('Performance Testing', () => {
  it('should handle large datasets efficiently', async () => {
    // Crear dataset de prueba
    const startSetup = Date.now();

    await Promise.all(
      Array.from({ length: 1000 }, (_, i) =>
        productRepository.save({
          name: `Performance Product ${i}`,
          slug: `performance-product-${i}`,
          price: Math.random() * 1000,
          stock: Math.floor(Math.random() * 100),
          isActive: true,
        }),
      ),
    );

    const setupTime = Date.now() - startSetup;
    console.log(`Dataset creation: ${setupTime}ms`);

    // Test de búsqueda
    const searchStart = Date.now();

    const searchResults = await productsService.searchProducts({
      search: 'Performance',
      page: 1,
      limit: 20,
      sortBy: ProductSortBy.PRICE,
      sortOrder: SortOrder.ASC,
    });

    const searchTime = Date.now() - searchStart;

    expect(searchTime).toBeLessThan(500); // <500ms
    expect(searchResults.data.length).toBeLessThanOrEqual(20);
    expect(searchResults.total).toBeGreaterThan(500);

    console.log(`Search performance: ${searchTime}ms`);
    console.log(`Results: ${searchResults.data.length}/${searchResults.total}`);
  }, 10000);

  it('should handle concurrent operations', async () => {
    const concurrentOperations = Array.from({ length: 50 }, (_, i) =>
      request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({ page: 1, limit: 10 }),
    );

    const start = Date.now();
    const results = await Promise.all(concurrentOperations);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000); // <2s para 50 requests
    expect(results.every((r) => r.status === 200)).toBe(true);

    console.log(`Concurrent operations (50): ${duration}ms`);
  });
});
```

### **3.3 Snapshot Testing**

```typescript
// Ejemplo: Snapshot testing para respuestas
describe('Snapshot Testing - API Responses', () => {
  it('should maintain consistent product response structure', async () => {
    const product = await createTestProduct();

    const response = await request(app.getHttpServer())
      .get(`/api/v1/products/${product.id}`)
      .expect(200);

    // Normalizar campos dinámicos
    const normalizedResponse = {
      ...response.body,
      id: '[UUID]',
      createdAt: '[TIMESTAMP]',
      updatedAt: '[TIMESTAMP]',
      createdBy: {
        ...response.body.createdBy,
        id: '[UUID]',
      },
    };

    expect(normalizedResponse).toMatchSnapshot();
  });

  it('should maintain search response structure', async () => {
    await createTestProducts(5);

    const response = await request(app.getHttpServer())
      .get('/api/v1/products/search')
      .query({ limit: 3 })
      .expect(200);

    const normalizedResponse = {
      ...response.body,
      data: response.body.data.map((item) => ({
        ...item,
        id: '[UUID]',
        createdAt: '[TIMESTAMP]',
        updatedAt: '[TIMESTAMP]',
      })),
    };

    expect(normalizedResponse).toMatchSnapshot();
  });
});
```

### **3.4 Mutation Testing**

```typescript
// Configuración para Mutation Testing
// stryker.config.js
module.exports = {
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
  ],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 80,
    low: 70,
    break: 60,
  },
  mutator: {
    excludedMutations: ['StringLiteral', 'ArrayDeclaration'],
  },
};

// Tests específicos para mejorar mutation score
describe('Mutation Testing - Critical Logic', () => {
  it('should validate all branches in product creation', async () => {
    // Test todas las ramas de validación

    // Branch 1: Producto válido
    const validProduct = await productsService.createProduct(validDto, user);
    expect(validProduct).toBeDefined();

    // Branch 2: Precio inválido
    await expect(
      productsService.createProduct({ ...validDto, price: -1 }, user),
    ).rejects.toThrow();

    // Branch 3: Stock inválido
    await expect(
      productsService.createProduct({ ...validDto, stock: -1 }, user),
    ).rejects.toThrow();

    // Branch 4: Categoría inexistente
    await expect(
      productsService.createProduct(
        { ...validDto, categoryIds: ['invalid'] },
        user,
      ),
    ).rejects.toThrow();

    // Branch 5: Slug duplicado
    await expect(
      productsService.createProduct(validDto, user), // Crear duplicado
    ).rejects.toThrow();
  });
});
```

---

## **PARTE 4: CONFIGURACIÓN DE CALIDAD** 📊

### **4.1 Jest Configuration Completa**

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  coverageThresholds: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/auth/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
    'src/products/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

// jest-e2e.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
  ],
  coverageDirectory: './coverage-e2e',
  testTimeout: 60000,
  setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.ts'],
  maxWorkers: 1, // E2E tests secuenciales
};
```

### **4.2 Scripts de Package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:e2e:cov": "jest --config ./test/jest-e2e.json --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=spec.ts$ --testPathIgnorePatterns=e2e",
    "test:performance": "jest --testNamePattern='Performance|performance'",
    "test:mutation": "stryker run",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:ci": "npm run test:all -- --coverage --watchAll=false"
  }
}
```

### **4.3 CI/CD Configuration**

```yaml
# .github/workflows/test.yml
name: Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:unit -- --coverage

      - name: Upload unit test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:integration -- --coverage

      - name: Upload integration test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: integration

  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e -- --coverage

      - name: Upload E2E test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage-e2e/lcov.info
          flags: e2e

  performance-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:performance

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results.json

  mutation-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:mutation

      - name: Comment mutation score
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));
            const score = results.mutationScore;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🧬 Mutation Testing Score: ${score}%`
            });
```

---

## **PARTE 5: HELPERS Y UTILITIES** 🛠️

### **5.1 Test Utilities**

```typescript
// test/utils/test-helpers.ts
export class TestHelpers {
  static async createTestUser(overrides: Partial<User> = {}): Promise<User> {
    return userRepository.save({
      email: 'test@example.com',
      password: 'hashedPassword123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      ...overrides,
    });
  }

  static async createTestAdmin(): Promise<User> {
    return this.createTestUser({
      role: UserRole.ADMIN,
      email: 'admin@example.com',
    });
  }

  static async createTestCategory(
    overrides: Partial<Category> = {},
  ): Promise<Category> {
    return categoryRepository.save({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Category for testing',
      isActive: true,
      ...overrides,
    });
  }

  static async createTestProduct(
    user: User,
    overrides: Partial<Product> = {},
  ): Promise<Product> {
    return productRepository.save({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Product for testing',
      price: 99.99,
      stock: 10,
      isActive: true,
      createdBy: user,
      ...overrides,
    });
  }

  static async getAuthToken(
    app: INestApplication,
    user: User,
  ): Promise<string> {
    const authService = app.get(AuthService);
    const result = await authService.login(user);
    return result.access_token;
  }

  static cleanDatabase(): Promise<void> {
    return Promise.all([
      productRepository.delete({}),
      categoryRepository.delete({}),
      userRepository.delete({}),
    ]).then(() => void 0);
  }

  static async waitFor(
    condition: () => Promise<boolean>,
    timeout = 5000,
    interval = 100,
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

// test/utils/mock-factories.ts
export class MockFactories {
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      id: 'mock-user-id',
      email: 'mock@test.com',
      firstName: 'Mock',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as User;
  }

  static createMockProduct(overrides: Partial<Product> = {}): Product {
    return {
      id: 'mock-product-id',
      name: 'Mock Product',
      slug: 'mock-product',
      price: 99.99,
      stock: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      categories: [],
      ...overrides,
    } as Product;
  }

  static createMockExecutionContext(): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    };
  }
}
```

### **5.2 Custom Jest Matchers**

```typescript
// test/matchers/custom-matchers.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toHaveValidPagination(): R;
      toMatchProductSchema(): R;
    }
  }
}

expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass,
    };
  },

  toHaveValidPagination(received: any) {
    const requiredFields = ['data', 'total', 'page', 'limit', 'totalPages'];
    const hasRequiredFields = requiredFields.every((field) =>
      Object.prototype.hasOwnProperty.call(received, field),
    );

    const validTypes =
      Array.isArray(received.data) &&
      typeof received.total === 'number' &&
      typeof received.page === 'number' &&
      typeof received.limit === 'number' &&
      typeof received.totalPages === 'number';

    const pass = hasRequiredFields && validTypes;

    return {
      message: () =>
        pass
          ? `Expected object not to have valid pagination structure`
          : `Expected object to have valid pagination structure with data, total, page, limit, totalPages`,
      pass,
    };
  },

  toMatchProductSchema(received: any) {
    const requiredFields = ['id', 'name', 'slug', 'price', 'stock'];
    const hasRequiredFields = requiredFields.every((field) =>
      Object.prototype.hasOwnProperty.call(received, field),
    );

    const validTypes =
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.slug === 'string' &&
      typeof received.price === 'number' &&
      typeof received.stock === 'number';

    const pass = hasRequiredFields && validTypes;

    return {
      message: () =>
        pass
          ? `Expected object not to match product schema`
          : `Expected object to match product schema with required fields and types`,
      pass,
    };
  },
});
```

---

## **PARTE 6: CHECKLIST DE IMPLEMENTACIÓN** ✅

### **📋 Checklist Completo**

```markdown
## Fase 1: Investigación Previa (OBLIGATORIO)

- [ ] Auditoría completa de entidades y relaciones
- [ ] Mapeo de todos los endpoints y sus respuestas exactas
- [ ] Documentación de DTOs y validaciones
- [ ] Verificación de configuración de testing actual
- [ ] Análisis de tests existentes (qué funciona vs qué falla)
- [ ] Identificación de casos de uso de negocio principales

## Fase 2: Foundation - Tests Unitarios

- [ ] Tests de servicios sin dependencias externas
- [ ] Tests de servicios con mocks de dependencias
- [ ] Tests de guards y middlewares
- [ ] Tests de DTOs y validaciones
- [ ] Tests de utilidades y helpers
- [ ] Configuración de coverage >95% para servicios core

## Fase 3: Integration Testing

- [ ] Tests de repositorios con DB real
- [ ] Tests de servicios con DB real
- [ ] Tests de controllers con context real
- [ ] Tests de transacciones y rollbacks
- [ ] Tests de constraints y relaciones
- [ ] Configuración de DB de testing aislada

## Fase 4: E2E Testing

- [ ] Happy path flows (registro → login → operaciones)
- [ ] Business logic flows complejos
- [ ] Authorization y security testing
- [ ] Error handling y edge cases
- [ ] Performance testing con datasets grandes
- [ ] API rate limiting y protecciones

## Fase 5: Advanced Testing

- [ ] Contract testing entre módulos
- [ ] Performance testing con métricas
- [ ] Snapshot testing para respuestas
- [ ] Mutation testing para calidad
- [ ] Security testing (SQL injection, XSS, etc.)
- [ ] Load testing y stress testing

## Fase 6: Quality & Automation

- [ ] Coverage configuration (>90% global)
- [ ] CI/CD pipeline con quality gates
- [ ] Automated reports y alertas
- [ ] Performance monitoring
- [ ] Test maintenance automation
- [ ] Documentation y runbooks

## Fase 7: Monitoring & Maintenance

- [ ] Test flakiness detection
- [ ] Performance regression alerts
- [ ] Coverage trend monitoring
- [ ] Automated test cleanup
- [ ] Regular test review y refactoring
```

---

## **🎯 CRITERIOS DE ÉXITO ENTERPRISE**

### **Métricas de Calidad**

- ✅ **Cobertura Total:** >90% statements, >85% branches
- ✅ **Mutation Score:** >80%
- ✅ **Test Performance:** Suite completa <5 minutos
- ✅ **Flakiness:** 0% tests inestables
- ✅ **Business Coverage:** 100% casos de uso críticos

### **Automatización**

- ✅ **CI/CD Integration:** Tests automáticos en cada PR
- ✅ **Quality Gates:** Bloqueo de merges con tests fallidos
- ✅ **Reports:** Coverage y performance automáticos
- ✅ **Alerts:** Notificaciones de regresiones

### **Mantenimiento**

- ✅ **Documentation:** Tests auto-documentados
- ✅ **Utilities:** Helpers reutilizables
- ✅ **Patterns:** Consistencia en todo el proyecto
- ✅ **Evolution:** Tests que evolucionan con el código

---

## **🚀 RESULTADO FINAL**

Una suite de testing enterprise completa que:

1. **Garantiza Calidad:** >90% coverage con tests significativos
2. **Previene Regresiones:** Tests automáticos en CI/CD
3. **Documenta Comportamiento:** Tests como documentación viva
4. **Facilita Refactoring:** Confianza para cambios grandes
5. **Escala con el Proyecto:** Patterns y utilities reutilizables
6. **Mantiene Performance:** Optimización continua de tests
7. **Proporciona Métricas:** Visibility completa de calidad

**Tiempo Estimado de Implementación:** 4-6 horas para aplicación completa

**ROI:** Reducción drástica de bugs en producción + Velocidad de desarrollo + Confianza en deployments

---

_Esta guía representa las mejores prácticas aprendidas de implementar testing enterprise en aplicaciones reales, evitando los errores comunes que encontramos inicialmente._
