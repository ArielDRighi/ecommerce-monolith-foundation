/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../../src/auth/entities/user.entity';
import { Product } from '../../../src/products/entities/product.entity';
import { Category } from '../../../src/products/entities/category.entity';
import { AuthService } from '../../../src/auth/auth.service';
import { RegisterDto } from '../../../src/auth/dto';

describe('Products E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let testCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');

    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  beforeEach(async () => {
    // Simple cleanup using repository methods in correct order
    try {
      // First clear the many-to-many relationship
      await productRepository.query('DELETE FROM product_categories');
      // Then clear products
      await productRepository.query('DELETE FROM products');
      // Clear categories
      await categoryRepository.query('DELETE FROM categories');
      // Clear users last
      await userRepository.query('DELETE FROM users');
    } catch (error) {
      // Fallback: continue anyway
      console.warn('Cleanup warning:', error.message);
    }

    // Create a test category first
    const category = categoryRepository.create({
      name: 'Test Category E2E',
      slug: `test-category-e2e-${Date.now()}`,
      description: 'Category for E2E testing',
      isActive: true,
    });
    const savedCategory = await categoryRepository.save(category);
    testCategoryId = savedCategory.id;

    // Create an admin user with unique email
    const timestamp = Date.now();
    const registerDto: RegisterDto = {
      email: `products-admin-${timestamp}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Products',
      lastName: 'Admin',
    };

    await authService.register(registerDto);

    // Get the created user and update to admin role
    const user = await userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (user) {
      user.role = UserRole.ADMIN;
      await userRepository.save(user);
    }

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: registerDto.email,
        password: registerDto.password,
      });

    authToken = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (Products)', () => {
    const getTestProduct = () => ({
      name: 'Test Product E2E',
      slug: `test-product-e2e-${Date.now()}`,
      description: 'Test product for E2E testing',
      price: 19.99,
      stock: 100,
      categoryIds: [testCategoryId],
      sku: 'TEST001',
      images: ['test-image.jpg'],
      attributes: {
        brand: 'Test Brand',
        color: 'Blue',
      },
      isActive: true,
    });

    it('/products (POST) - should create a new product', async () => {
      const testProduct = getTestProduct();
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(testProduct.name);
      expect(response.body.data.price).toBe(testProduct.price);
    });

    it('/products (GET) - should get all products', async () => {
      // First create a product to ensure we have data
      const testProduct = getTestProduct();
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      // Then get all products
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('/products/:id (GET) - should get a product by id', async () => {
      // First create a product
      const testProduct = getTestProduct();
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      const createdProductId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(createdProductId);
      expect(response.body.data.name).toBe(testProduct.name);
    });

    it('/products/:id (GET) - should return 404 for non-existent product', async () => {
      // Use a valid UUID format but non-existent product
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/products/${nonExistentId}`)
        .expect(404);
    });

    it('/products/:id (PATCH) - should update a product', async () => {
      // First create a product
      const testProduct = getTestProduct();
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      const createdProductId = createResponse.body.data.id;

      const updateData = {
        name: 'Updated Product Name',
        price: 29.99,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('/products/search (GET) - should search products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({ search: 'Updated' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/products/category/:category (GET) - should get products by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/category/${testCategoryId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/products/:id (DELETE) - should delete a product', async () => {
      // First create a product
      const testProduct = getTestProduct();
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      const createdProductId = createResponse.body.data.id;

      // Delete the product
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify product is deleted
      await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductId}`)
        .expect(404);
    });

    it('/products (POST) - should fail without authentication', async () => {
      const testProduct = getTestProduct();
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(testProduct)
        .expect(401);
    });

    it('/products (POST) - should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          price: -10, // Invalid: negative price
        })
        .expect(400);
    });
  });
});
