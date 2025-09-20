/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../src/auth/entities/user.entity';

describe('Snapshot Testing E2E - API Response Validation', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let customerToken: string;
  let testCategory: any;
  let testProduct: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = app.get<DataSource>(DataSource);
    await dataSource.synchronize(true);
    await setupTestData();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  async function setupTestData(): Promise<void> {
    // Try to login with default admin credentials first
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@ecommerce.com',
          password: 'AdminPassword123!',
        });

      adminToken = adminLoginResponse.body.data.access_token;
    } catch {
      // Create admin user via registration and DB update
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'snapshot-admin@test.com',
        password: 'AdminPassword123!',
        firstName: 'Snapshot',
        lastName: 'Admin',
      });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'snapshot-admin@test.com',
          password: 'AdminPassword123!',
        });

      adminToken = loginResponse.body.data.access_token;

      // Update role directly in database
      await dataSource.query('UPDATE "users" SET role = $1 WHERE email = $2', [
        UserRole.ADMIN,
        'snapshot-admin@test.com',
      ]);
    }

    // Create customer user
    const customerData = {
      email: 'snapshot-customer@test.com',
      password: 'CustomerPassword123!',
      firstName: 'Snapshot',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
    };

    const customerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(customerData);

    customerToken = customerResponse.body.data.access_token;

    // Create test category
    const categoryResponse = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Snapshot Electronics',
        slug: 'snapshot-electronics',
        description: 'Electronics category for snapshot testing',
        sortOrder: 1,
      });

    testCategory = categoryResponse.body.data;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Snapshot Test Product',
        slug: 'snapshot-test-product',
        description:
          'A high-quality product for snapshot testing with consistent data',
        price: 299.99,
        stock: 100,
        categoryIds: [testCategory.id],
        sku: 'SNAP-001',
        images: ['snapshot-product-1.jpg', 'snapshot-product-2.jpg'],
        attributes: {
          brand: 'SnapshotTech',
          warranty: '2 years',
          color: 'Black',
          weight: '1.5kg',
        },
        isActive: true,
      });

    testProduct = productResponse.body.data;
  }

  function sanitizeResponseForSnapshot(response: any): any {
    // Remove dynamic fields that change between test runs
    const sanitized = JSON.parse(JSON.stringify(response.body));

    function removeDynamicFields(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(removeDynamicFields);
      }

      if (obj && typeof obj === 'object') {
        const cleaned = { ...obj };

        // Remove common dynamic fields
        delete cleaned.id;
        delete cleaned.createdAt;
        delete cleaned.updatedAt;
        delete cleaned.access_token;
        delete cleaned.refresh_token;
        delete cleaned.correlationId;
        delete cleaned.timestamp;

        // Special handling for meta.path to remove dynamic UUIDs
        if (
          cleaned.meta &&
          cleaned.meta.path &&
          typeof cleaned.meta.path === 'string'
        ) {
          const pathString = cleaned.meta.path as string;
          cleaned.meta.path = pathString.replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            '{uuid}',
          );
        }

        // Clean nested objects
        Object.keys(cleaned).forEach((key) => {
          cleaned[key] = removeDynamicFields(cleaned[key]);
        });

        return cleaned;
      }

      return obj;
    }

    return removeDynamicFields(sanitized);
  }

  describe('Authentication Response Snapshots', () => {
    it('should match register response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'snapshot-register@test.com',
          password: 'RegisterPassword123!',
          firstName: 'Snapshot',
          lastName: 'Register',
        })
        .expect(201);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('auth-register-response');
    });

    it('should match login response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'snapshot-admin@test.com',
          password: 'AdminPassword123!',
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('auth-login-response');
    });

    it('should match profile response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('auth-profile-response');
    });

    it('should match validation error response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          firstName: '',
        })
        .expect(400);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot(
        'auth-validation-error-response',
      );
    });
  });

  describe('Product Response Snapshots', () => {
    it('should match product creation response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Snapshot Product Creation',
          slug: 'snapshot-product-creation',
          description: 'Product created for snapshot testing',
          price: 199.99,
          stock: 50,
          categoryIds: [testCategory.id],
          sku: 'SNAP-CRT1',
          images: ['create-1.jpg', 'create-2.jpg'],
          attributes: {
            brand: 'SnapshotBrand',
            color: 'Red',
            warranty: '1 year',
          },
          isActive: true,
        })
        .expect(201);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('product-creation-response');
    });

    it('should match product details response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('product-details-response');
    });

    it('should match product update response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Snapshot Product',
          price: 399.99,
          stock: 75,
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('product-update-response');
    });

    it('should match product search response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 1,
          limit: 10,
          search: 'Snapshot',
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('product-search-response');
    });

    it('should match product by slug response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/slug/${testProduct.slug}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('product-by-slug-response');
    });
  });

  describe('Category Response Snapshots', () => {
    it('should match category creation response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Snapshot Category',
          slug: 'snapshot-category',
          description: 'Category created for snapshot testing',
          sortOrder: 10,
        })
        .expect(201);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('category-creation-response');
    });

    it('should match category details response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/${testCategory.id}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('category-details-response');
    });

    it('should match category update response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Snapshot Electronics',
          description: 'Updated description for snapshot testing',
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('category-update-response');
    });
  });

  describe('Error Response Snapshots', () => {
    it('should match unauthorized error response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          name: 'Unauthorized Product',
          price: 99.99,
        })
        .expect(401);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('unauthorized-error-response');
    });

    it('should match forbidden error response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Forbidden Product',
          slug: 'forbidden-product',
          description: 'Product creation should be forbidden for customers',
          price: 99.99,
          stock: 10,
        })
        .expect(403);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('forbidden-error-response');
    });

    it('should match not found error response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('not-found-error-response');
    });

    it('should match validation error response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          slug: '',
          price: -1,
          stock: -5,
        })
        .expect(400);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot(
        'product-validation-error-response',
      );
    });
  });

  describe('Pagination Response Snapshots', () => {
    it('should match paginated search response structure snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 1,
          limit: 5,
          sortBy: 'name',
          sortOrder: 'ASC',
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('paginated-search-response');
    });

    it('should match empty search result response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({
          page: 1,
          limit: 10,
          search: 'NonExistentProductSearchTerm',
        })
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('empty-search-result-response');
    });
  });

  describe('Success Response Structure Snapshots', () => {
    it('should match success response wrapper structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('success-response-wrapper');
    });

    it('should match logout success response snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const sanitizedResponse = sanitizeResponseForSnapshot(response);
      expect(sanitizedResponse).toMatchSnapshot('logout-success-response');
    });
  });
});
