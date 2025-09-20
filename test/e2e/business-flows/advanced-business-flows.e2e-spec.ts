/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../../src/auth/entities/user.entity';
import { AuthService } from '../../../src/auth/auth.service';
import { RegisterDto } from '../../../src/auth/dto';

describe('Advanced Business Flows E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let adminUser: User;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // Set global prefix to match main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();

    // Get services and repositories
    dataSource = moduleFixture.get<DataSource>(DataSource);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    authService = app.get<AuthService>(AuthService);

    // Clean database before tests
    await dataSource.synchronize(true);

    // Setup authentication tokens
    await setupAuthentication();
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
    await app.close();
  });

  async function setupAuthentication() {
    // Create admin user through service
    const adminRegisterDto: RegisterDto = {
      email: 'admin@advanced.test',
      password: 'AdminPass123!',
      firstName: 'Advanced',
      lastName: 'Admin',
    };

    const adminResult = await authService.register(adminRegisterDto);
    adminUser = (await userRepository.findOne({
      where: { id: adminResult.user.id },
    })) as User;
    adminToken = adminResult.access_token;

    // Manually set admin role (since register defaults to CUSTOMER)
    adminUser.role = UserRole.ADMIN;
    await userRepository.save(adminUser);

    // Create customer user
    const customerRegisterDto: RegisterDto = {
      email: 'customer@advanced.test',
      password: 'CustomerPass123!',
      firstName: 'Advanced',
      lastName: 'Customer',
    };

    const customerResult = await authService.register(customerRegisterDto);
    customerToken = customerResult.access_token;
  }

  describe('Registration and Complete User Journey', () => {
    it('should handle complete user registration and first purchase flow', async () => {
      const uniqueId = Date.now();
      const newUserEmail = `testuser${uniqueId}@example.com`;

      // 1. USER REGISTRATION
      const registrationData = {
        firstName: 'Test',
        lastName: 'User',
        email: newUserEmail,
        password: 'SecurePassword123!',
        role: UserRole.CUSTOMER,
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201);

      expect(registerResponse.body.data.user.email).toBe(newUserEmail);
      expect(registerResponse.body.data.user.role).toBe(UserRole.CUSTOMER);

      // 2. LOGIN WITH NEW USER
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: newUserEmail,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const newUserToken = loginResponse.body.data.access_token;

      // 3. BROWSE PRODUCTS AS NEW USER
      const browseResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .set('Authorization', `Bearer ${newUserToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(browseResponse.body.data).toBeDefined();

      // 4. GET USER PROFILE
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(newUserEmail);
      expect(profileResponse.body.data.role).toBe(UserRole.CUSTOMER);
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid authentication gracefully', async () => {
      // Invalid token
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Malformed token
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer')
        .expect(401);

      // No authorization header
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should handle invalid product creation data', async () => {
      // Missing required fields
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          // Missing slug, price, stock, categoryIds
        })
        .expect(400);

      // Invalid price
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          slug: 'test-product-invalid',
          price: -100, // Invalid negative price
          stock: 10,
          categoryIds: ['550e8400-e29b-41d4-a716-446655440000'],
        })
        .expect(400);

      // Invalid UUID in categoryIds
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          slug: 'test-product-invalid-uuid',
          price: 100,
          stock: 10,
          categoryIds: ['invalid-uuid'],
        })
        .expect(400);
    });

    it('should handle non-existent resource requests', async () => {
      const nonExistentUuid = '550e8400-e29b-41d4-a716-446655440999';

      // Non-existent product
      await request(app.getHttpServer())
        .get(`/api/v1/products/${nonExistentUuid}`)
        .expect(404);

      // Non-existent category
      await request(app.getHttpServer())
        .get(`/api/v1/products/categories/${nonExistentUuid}`)
        .expect(404);

      // Try to update non-existent product
      await request(app.getHttpServer())
        .patch(`/api/v1/products/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('Complex Product Management Workflows', () => {
    it('should handle bulk product operations', async () => {
      // First create a category for bulk operations
      const categoryData = {
        name: `Bulk Test Category ${Date.now()}`,
        slug: `bulk-test-category-${Date.now()}`,
        description: 'Category for bulk operations testing',
      };

      const categoryResponse = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      const testCategory = categoryResponse.body.data;
      const createdProducts: any[] = [];

      // Create multiple products in sequence
      for (let i = 1; i <= 10; i++) {
        const productData = {
          name: `Bulk Product ${i}`,
          slug: `bulk-product-${i}-${Date.now()}`,
          description: `Description for bulk product ${i}`,
          price: 50 + i * 10,
          stock: 100 + i,
          categoryIds: [testCategory.id],
        };

        const productResponse = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        createdProducts.push(productResponse.body.data);
      }

      expect(createdProducts).toHaveLength(10);

      // Verify all products were created and can be searched
      const searchResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          search: 'Bulk Product',
          limit: 20,
        })
        .expect(200);

      expect(searchResponse.body.data.length).toBeGreaterThanOrEqual(10);

      // Test category filtering
      const categoryFilterResponse = await request(app.getHttpServer())
        .get(`/api/v1/products/category/${testCategory.id}`)
        .query({ limit: 20 })
        .expect(200);

      expect(categoryFilterResponse.body.data.length).toBe(10);
    }, 60000);

    it('should handle product lifecycle management', async () => {
      const timestamp = Date.now();

      // Create category
      const categoryData = {
        name: `Lifecycle Category ${timestamp}`,
        slug: `lifecycle-category-${timestamp}`,
        description: 'Category for lifecycle testing',
      };

      const categoryResponse = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      const category = categoryResponse.body.data;

      // Create product
      const productData = {
        name: `Lifecycle Product ${timestamp}`,
        slug: `lifecycle-product-${timestamp}`,
        description: 'Product for lifecycle testing',
        price: 299.99,
        stock: 50,
        categoryIds: [category.id],
        isActive: true,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      const product = createResponse.body.data;

      // Update product multiple times
      const updates = [
        { name: `Updated ${product.name} v1`, price: 349.99 },
        { description: 'Updated description for lifecycle testing', stock: 75 },
        { price: 399.99, stock: 100 },
      ];

      for (const update of updates) {
        const updateResponse = await request(app.getHttpServer())
          .patch(`/api/v1/products/${product.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(update)
          .expect(200);

        // Verify update was applied
        expect(updateResponse.body.data.id).toBe(product.id);
        if (update.name)
          expect(updateResponse.body.data.name).toBe(update.name);
        if (update.price)
          expect(updateResponse.body.data.price).toBe(update.price);
        if (update.stock)
          expect(updateResponse.body.data.stock).toBe(update.stock);
      }

      // Verify final state
      const finalStateResponse = await request(app.getHttpServer())
        .get(`/api/v1/products/${product.id}`)
        .expect(200);

      expect(finalStateResponse.body.data.price).toBe(399.99);
      expect(finalStateResponse.body.data.stock).toBe(100);

      // Test soft delete
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify product is no longer accessible
      await request(app.getHttpServer())
        .get(`/api/v1/products/${product.id}`)
        .expect(404);
    }, 45000);
  });

  describe('Advanced Search and Filtering', () => {
    it('should handle complex search scenarios', async () => {
      // Test empty search results
      const emptySearchResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          search: 'NonExistentProductNameThatShouldNotBeFound12345',
          limit: 10,
        })
        .expect(200);

      expect(emptySearchResponse.body.data).toHaveLength(0);

      // Test search with various filters
      const complexSearchResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          minPrice: 100,
          maxPrice: 1000,
          inStock: true,
          sortBy: 'price',
          sortOrder: 'ASC',
          page: 1,
          limit: 5,
        })
        .expect(200);

      expect(complexSearchResponse.body.data).toBeDefined();

      // Test pagination edge cases
      const highPageResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 999,
          limit: 10,
        })
        .expect(200);

      expect(highPageResponse.body.data).toBeDefined();
      expect(Array.isArray(highPageResponse.body.data)).toBe(true);
    });

    it('should handle search parameter validation', async () => {
      // Invalid page number
      await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 0, // Should be >= 1
          limit: 10,
        })
        .expect(400);

      // Invalid limit
      await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 1,
          limit: 150, // Should be <= 100
        })
        .expect(400);

      // Invalid price range
      await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          minPrice: 1000,
          maxPrice: 100, // maxPrice < minPrice
        })
        .expect(400);

      // Invalid sort parameters
      await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          sortBy: 'invalid-field',
        })
        .expect(400);
    });
  });

  describe('Security and Authorization Edge Cases', () => {
    it('should handle token expiration and refresh scenarios', async () => {
      // This would typically require setting up a short-lived token for testing
      // For now, we'll test with invalid/malformed tokens

      const invalidTokens = [
        'Bearer expired.token.here',
        'Bearer malformed-token',
        'InvalidFormat token',
        'Bearer ', // Empty token
      ];

      for (const invalidToken of invalidTokens) {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', invalidToken)
          .expect(401);
      }
    });

    it('should prevent privilege escalation attempts', async () => {
      // Customer trying to create admin-only resources
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Hacker Category',
          slug: 'hacker-category',
        })
        .expect(403);

      // Customer trying to delete products
      await request(app.getHttpServer())
        .delete('/api/v1/products/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      // Customer trying to access admin endpoints (if they exist)
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404); // or 403, depending on implementation
    });

    it('should handle SQL injection attempts in search', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE products; --",
        "' OR '1'='1",
        "'; UPDATE products SET price = 0; --",
        "' UNION SELECT * FROM users --",
      ];

      for (const maliciousQuery of sqlInjectionAttempts) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            search: maliciousQuery,
          })
          .expect(200); // Should handle gracefully without crashing

        // Should return empty or safe results, not execute malicious SQL
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('API Rate Limiting and Performance', () => {
    it('should handle rapid successive requests', async () => {
      const promises: Promise<any>[] = [];

      // Make 10 rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/api/v1/products/search')
            .query({ limit: 5 }),
        );
      }

      const responses = await Promise.all(promises);

      // All requests should complete (assuming no rate limiting in test env)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status); // 200 OK or 429 Too Many Requests
      });
    }, 15000);

    it('should handle large response datasets efficiently', async () => {
      const startTime = Date.now();

      const largeSearchResponse = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          limit: 100, // Maximum allowed
          page: 1,
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(largeSearchResponse.body.data).toBeDefined();
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
