/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { User, UserRole } from '../../../src/auth/entities/user.entity';
import { AuthService } from '../../../src/auth/auth.service';
import { RegisterDto } from '../../../src/auth/dto';

describe('Contract Testing - API Contracts & Data Schemas', () => {
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

    dataSource = app.get<DataSource>(DataSource);
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);
    await dataSource.synchronize(true);

    // Setup authentication tokens
    await setupAuthentication();
  });

  async function setupAuthentication() {
    // Create admin user through service (defaults to CUSTOMER)
    const adminRegisterDto: RegisterDto = {
      email: 'admin@contract.test',
      password: 'AdminPass123!',
      firstName: 'Contract',
      lastName: 'Admin',
    };

    const adminResult = await authService.register(adminRegisterDto);
    adminUser = (await userRepository.findOne({
      where: { id: adminResult.user.id },
    })) as User;

    // Manually set admin role (since register defaults to CUSTOMER)
    adminUser.role = UserRole.ADMIN;
    await userRepository.save(adminUser);
    adminToken = adminResult.access_token;

    // Create customer user
    const customerRegisterDto: RegisterDto = {
      email: 'customer@contract.test',
      password: 'CustomerPass123!',
      firstName: 'Contract',
      lastName: 'Customer',
    };

    const customerResult = await authService.register(customerRegisterDto);
    customerToken = customerResult.access_token;
  }

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('Authentication API Contracts', () => {
    describe('POST /auth/register', () => {
      it('should have correct request/response contract for user registration', async () => {
        const registerPayload = {
          email: 'contract@example.com',
          password: 'ContractTest123!',
          firstName: 'Contract',
          lastName: 'Test',
          phone: '+1234567890',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(registerPayload)
          .expect(201);

        // Response contract validation
        expect(response.body).toMatchObject({
          success: true,
          data: {
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            expires_in: expect.any(Number),
            token_type: 'Bearer',
            user: {
              id: expect.any(String),
              email: registerPayload.email,
              firstName: registerPayload.firstName,
              lastName: registerPayload.lastName,
              role: UserRole.CUSTOMER,
              phone: registerPayload.phone,
              isActive: true,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          },
          meta: expect.objectContaining({
            statusCode: 201,
            method: 'POST',
            path: '/api/v1/auth/register',
          }),
        });

        // Validate token format
        expect(response.body.data.access_token).toMatch(
          /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        );
        expect(response.body.data.refresh_token).toMatch(
          /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        );

        // Validate timestamps are ISO format
        expect(new Date(response.body.data.user.createdAt).toISOString()).toBe(
          response.body.data.user.createdAt,
        );
        expect(new Date(response.body.data.user.updatedAt).toISOString()).toBe(
          response.body.data.user.updatedAt,
        );
      });

      it('should reject invalid registration payloads with proper error contract', async () => {
        const invalidPayloads = [
          {
            // Missing email
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
          },
          {
            // Invalid email format
            email: 'invalid-email',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
          },
          {
            // Weak password
            email: 'test@example.com',
            password: '123',
            firstName: 'Test',
            lastName: 'User',
          },
          {
            // Missing required fields
            email: 'test@example.com',
            password: 'Password123!',
            // Missing firstName and lastName
          },
        ];

        for (const payload of invalidPayloads) {
          const response = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send(payload)
            .expect(400);

          // Error response contract validation
          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'BadRequestException',
              message: 'Bad Request Exception',
              details: {
                statusCode: 400,
                message: expect.any(Object),
                error: 'Bad Request',
              },
            },
          });

          expect(typeof response.body.error.details.message).toBe('object');
          expect(
            Object.keys(response.body.error.details.message).length,
          ).toBeGreaterThan(0);
        }
      });
    });

    describe('POST /auth/login', () => {
      it('should have correct request/response contract for user login', async () => {
        const loginPayload = {
          email: 'contract@example.com',
          password: 'ContractTest123!',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginPayload)
          .expect(200);

        // Response contract validation
        expect(response.body).toMatchObject({
          success: true,
          data: {
            access_token: expect.any(String),
            refresh_token: expect.any(String),
            expires_in: expect.any(Number),
            token_type: 'Bearer',
            user: {
              id: expect.any(String),
              email: loginPayload.email,
              firstName: expect.any(String),
              lastName: expect.any(String),
              role: expect.any(String),
              isActive: true,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          },
          meta: expect.objectContaining({
            statusCode: 200,
            method: 'POST',
            path: '/api/v1/auth/login',
          }),
        });

        // Validate sensitive data is not exposed
        expect(response.body.data.user.passwordHash).toBeUndefined();
        expect(response.body.data.user.password).toBeUndefined();
      });

      it('should return 401 for invalid credentials with proper error contract', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'WrongPassword123!',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UnauthorizedException',
            message: 'Invalid credentials',
            details: {
              statusCode: 401,
              message: 'Invalid credentials',
              error: 'Unauthorized',
            },
          },
        });
      });
    });

    describe('GET /auth/profile', () => {
      it('should have correct response contract for authenticated user profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
            isActive: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          meta: expect.objectContaining({
            statusCode: 200,
            method: 'GET',
            path: '/api/v1/auth/profile',
          }),
        });

        // Validate sensitive fields are excluded
        expect(response.body.passwordHash).toBeUndefined();
        expect(response.body.password).toBeUndefined();
      });

      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UnauthorizedException',
            message: 'Unauthorized',
            details: {
              statusCode: 401,
              message: 'Unauthorized',
            },
          },
        });
      });
    });
  });

  describe('Products API Contracts', () => {
    let testCategoryId: string;
    let testProductId: string;

    beforeAll(async () => {
      // Create test category
      const categoryResponse = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Contract Test Category',
          slug: 'contract-test-category',
          description: 'Category for contract testing',
        })
        .expect(201);

      testCategoryId = categoryResponse.body.data.id;
    });

    describe('POST /products', () => {
      it('should have correct request/response contract for product creation', async () => {
        const productPayload = {
          name: 'Contract Test Product',
          slug: 'contract-test-product',
          description: 'Product for contract testing',
          price: 299.99,
          stock: 100,
          categoryIds: [testCategoryId],
          sku: 'CTRCT-001',
          images: ['image1.jpg', 'image2.jpg'],
          attributes: {
            color: 'Red',
            size: 'Large',
            material: 'Cotton',
          },
          isActive: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productPayload)
          .expect(201);

        testProductId = response.body.data.id;

        // Response contract validation
        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: productPayload.name,
            slug: productPayload.slug,
            description: productPayload.description,
            price: productPayload.price,
            stock: productPayload.stock,
            sku: productPayload.sku,
            images: productPayload.images,
            attributes: productPayload.attributes,
            isActive: productPayload.isActive,
            viewCount: 0,
            orderCount: 0,
            rating: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            categories: expect.arrayContaining([
              expect.objectContaining({
                id: testCategoryId,
                name: expect.any(String),
                slug: expect.any(String),
              }),
            ]),
            createdBy: expect.objectContaining({
              id: expect.any(String),
              email: expect.any(String),
              firstName: expect.any(String),
              lastName: expect.any(String),
            }),
          },
          meta: expect.objectContaining({
            statusCode: 201,
            method: 'POST',
            path: '/api/v1/products',
          }),
        });

        // Validate UUID format for IDs
        expect(response.body.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );

        // Validate timestamps
        expect(new Date(response.body.data.createdAt).toISOString()).toBe(
          response.body.data.createdAt,
        );
        expect(new Date(response.body.data.updatedAt).toISOString()).toBe(
          response.body.data.updatedAt,
        );
      });

      it('should reject invalid product payloads with proper error contract', async () => {
        const invalidPayloads = [
          {
            // Missing name
            slug: 'test-product',
            price: 100,
            stock: 10,
            categoryIds: [testCategoryId],
          },
          {
            // Invalid price (negative)
            name: 'Test Product',
            slug: 'test-product',
            price: -100,
            stock: 10,
            categoryIds: [testCategoryId],
          },
          {
            // Invalid categoryIds (non-existent)
            name: 'Test Product',
            slug: 'test-product',
            price: 100,
            stock: 10,
            categoryIds: ['non-existent-id'],
          },
        ];

        for (const payload of invalidPayloads) {
          const response = await request(app.getHttpServer())
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload)
            .expect(400);

          expect(response.body).toMatchObject({
            error: {
              code: 'BadRequestException',
              message: 'Bad Request Exception',
              details: {
                statusCode: 400,
                message: expect.any(Object),
                error: 'Bad Request',
              },
            },
          });
        }
      });

      it('should return 403 for non-admin users', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/products')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            name: 'Unauthorized Product',
            slug: 'unauthorized-product',
            price: 100,
            stock: 10,
            categoryIds: [testCategoryId],
          })
          .expect(403);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'ForbiddenException',
            message: 'Access denied. Required roles: admin',
            details: {
              statusCode: 403,
              message: 'Access denied. Required roles: admin',
              error: 'Forbidden',
            },
          },
        });
      });
    });

    describe('GET /products/search', () => {
      it('should have correct response contract for product search', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            page: 1,
            limit: 10,
            search: 'Contract',
            minPrice: 100,
            maxPrice: 500,
            sortBy: 'price',
            sortOrder: 'ASC',
          })
          .expect(200);

        // Response contract validation
        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });

        // If products exist, validate product structure
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            price: expect.any(Number),
            stock: expect.any(Number),
            isActive: expect.any(Boolean),
            viewCount: expect.any(Number),
            orderCount: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            categories: expect.any(Array),
          });

          // Validate price is within requested range
          expect(response.body.data[0].price).toBeGreaterThanOrEqual(100);
          expect(response.body.data[0].price).toBeLessThanOrEqual(500);
        }
      });

      it('should handle empty search results with proper contract', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            search: 'NonExistentProduct12345',
            page: 1,
            limit: 10,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: [],
        });
      });

      it('should validate query parameters and return proper errors', async () => {
        const invalidQueries = [
          { page: -1 }, // Invalid page
          { limit: 0 }, // Invalid limit
          { minPrice: 'invalid' }, // Invalid minPrice type
          { sortBy: 'invalid_field' }, // Invalid sortBy
        ];

        for (const query of invalidQueries) {
          const response = await request(app.getHttpServer())
            .get('/api/v1/products/search')
            .query(query)
            .expect(400);

          expect(response.body).toMatchObject({
            error: {
              code: 'BadRequestException',
              message: 'Bad Request Exception',
              details: {
                statusCode: 400,
                message: expect.any(Object),
                error: 'Bad Request',
              },
            },
          });
        }
      });
    });

    describe('PATCH /products/:id', () => {
      it('should have correct request/response contract for product update', async () => {
        const updatePayload = {
          name: 'Updated Contract Test Product',
          price: 399.99,
          stock: 50,
          attributes: {
            color: 'Blue',
            size: 'Medium',
            material: 'Polyester',
          },
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updatePayload)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: testProductId,
            name: updatePayload.name,
            price: updatePayload.price,
            stock: updatePayload.stock,
            attributes: updatePayload.attributes,
            updatedAt: expect.any(String),
          },
        });

        // Verify updatedAt changed
        expect(
          new Date(response.body.data.updatedAt).getTime(),
        ).toBeGreaterThan(new Date(response.body.data.createdAt).getTime());
      });

      it('should return 404 for non-existent product with proper error contract', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/products/123e4567-e89b-12d3-a456-426614174000')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Product',
            price: 200,
          })
          .expect(404);

        expect(response.body).toMatchObject({
          error: {
            code: 'NotFoundException',
            message: expect.stringContaining('not found'),
            details: {
              statusCode: 404,
              message: expect.stringContaining('not found'),
              error: 'Not Found',
            },
          },
        });
      });
    });
  });

  describe('Category API Contracts', () => {
    describe('POST /categories', () => {
      it('should have correct request/response contract for category creation', async () => {
        const categoryPayload = {
          name: 'API Contract Category',
          slug: 'api-contract-category',
          description: 'Category for API contract testing',
          isActive: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryPayload)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: categoryPayload.name,
            slug: categoryPayload.slug,
            description: categoryPayload.description,
            isActive: categoryPayload.isActive,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        });

        // Validate UUID format
        expect(response.body.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      });
    });

    describe('GET /categories', () => {
      it.skip('should have correct response contract for categories list', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/categories')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
        });

        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            isActive: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        }
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('should have consistent error response format across all endpoints', async () => {
      const errorEndpoints = [
        {
          method: 'GET',
          path: '/api/v1/products/123e4567-e89b-12d3-a456-426614174000',
          expectedStatus: 404,
        },
        {
          method: 'PATCH',
          path: '/api/v1/products/123e4567-e89b-12d3-a456-426614174000',
          expectedStatus: 404,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { name: 'Test' },
        },
        {
          method: 'DELETE',
          path: '/api/v1/products/123e4567-e89b-12d3-a456-426614174000',
          expectedStatus: 404,
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        {
          method: 'GET',
          path: '/api/v1/products/categories/123e4567-e89b-12d3-a456-426614174000',
          expectedStatus: 404,
        },
      ];

      for (const endpoint of errorEndpoints) {
        let requestBuilder: request.Test;

        // Type-safe request method selection
        switch (endpoint.method.toLowerCase()) {
          case 'get':
            requestBuilder = request(app.getHttpServer()).get(endpoint.path);
            break;
          case 'post':
            requestBuilder = request(app.getHttpServer()).post(endpoint.path);
            break;
          case 'patch':
            requestBuilder = request(app.getHttpServer()).patch(endpoint.path);
            break;
          case 'put':
            requestBuilder = request(app.getHttpServer()).put(endpoint.path);
            break;
          case 'delete':
            requestBuilder = request(app.getHttpServer()).delete(endpoint.path);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
        }

        if (endpoint.headers) {
          requestBuilder = requestBuilder.set(endpoint.headers);
        }

        if (endpoint.body) {
          requestBuilder = requestBuilder.send(endpoint.body);
        }

        const response = await requestBuilder.expect(endpoint.expectedStatus);

        // Validate consistent error response structure
        expect(response.body).toMatchObject({
          error: {
            code: expect.any(String),
            message: expect.any(String),
            details: {
              statusCode: endpoint.expectedStatus,
              message: expect.any(String),
              error: expect.any(String),
            },
          },
        });

        // Validate error names match HTTP status codes
        const expectedErrors = {
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          409: 'Conflict',
          500: 'Internal Server Error',
        };

        if (
          expectedErrors[endpoint.expectedStatus as keyof typeof expectedErrors]
        ) {
          expect(response.body.error.details.error).toBe(
            expectedErrors[
              endpoint.expectedStatus as keyof typeof expectedErrors
            ],
          );
        }
      }
    });
  });

  describe('Data Type Validation Contracts', () => {
    it('should enforce strict data types in request/response', async () => {
      const categoryResponse = await request(app.getHttpServer())
        .post('/api/v1/products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Type Validation Category',
          slug: 'type-validation-category',
          description: 'Category for type validation testing',
        })
        .expect(201);

      const productPayload = {
        name: 'Type Test Product',
        slug: 'type-test-product',
        description: 'Product for type testing',
        price: 150.75, // Decimal number
        stock: 25, // Integer
        categoryIds: [categoryResponse.body.data.id], // Array of strings
        sku: 'TYPE-001', // String
        images: ['img1.jpg', 'img2.jpg'], // Array of strings
        attributes: {
          // Object
          weight: '2.5kg',
          dimensions: '10x20x30cm',
          warranty: 2,
        },
        isActive: true, // Boolean
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productPayload)
        .expect(201);

      // Validate response data types
      expect(typeof response.body.data.id).toBe('string');
      expect(typeof response.body.data.name).toBe('string');
      expect(typeof response.body.data.price).toBe('number');
      expect(typeof response.body.data.stock).toBe('number');
      expect(typeof response.body.data.isActive).toBe('boolean');
      expect(Array.isArray(response.body.data.images)).toBe(true);
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(typeof response.body.data.attributes).toBe('object');
      expect(response.body.data.attributes).not.toBeNull();

      // Validate nested object types
      expect(typeof response.body.data.createdBy.id).toBe('string');
      expect(typeof response.body.data.createdBy.email).toBe('string');
      expect(typeof response.body.data.categories[0].id).toBe('string');
      expect(typeof response.body.data.categories[0].name).toBe('string');
    });
  });
});
