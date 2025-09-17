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
import { AuthService } from '../../../src/auth/auth.service';
import { RegisterDto } from '../../../src/auth/dto';

describe('Products E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let authService: AuthService;
  let userRepository: Repository<User>;

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

    // Create an admin user via AuthService
    const registerDto: RegisterDto = {
      email: 'products-admin@example.com',
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
    let productId: string;

    const testProduct = {
      name: 'Test Product E2E',
      description: 'Test product for E2E testing',
      price: 19.99,
      category: 'test-category',
      stock: 100,
    };

    it('/products (POST) - should create a new product', async () => {
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
      productId = response.body.data.id;
    });

    it('/products (GET) - should get all products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('/products/:id (GET) - should get a product by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.name).toBe(testProduct.name);
    });

    it('/products/:id (GET) - should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/999')
        .expect(404);
    });

    it('/products/:id (PUT) - should update a product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 29.99,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
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
        .query({ q: 'Updated' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/products/category/:category (GET) - should get products by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/category/${testProduct.category}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/products/:id (DELETE) - should delete a product', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify product is deleted
      await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(404);
    });

    it('/products (POST) - should fail without authentication', async () => {
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
