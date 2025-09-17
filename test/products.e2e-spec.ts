import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Products E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    // Register and get auth token
    const testUser = {
      email: 'products-test@example.com',
      password: 'TestPassword123!',
      firstName: 'Products',
      lastName: 'Tester',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const authResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    authToken = authResponse.body.access_token;
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.name).toBe(testProduct.name);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.price).toBe(testProduct.price);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      productId = response.body.id;
    });

    it('/products (GET) - should get all products', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('/products/:id (GET) - should get a product by id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.id).toBe(productId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.name).toBe(testProduct.name);
    });

    it('/products/:id (GET) - should return 404 for non-existent product', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).get('/products/999').expect(404);
    });

    it('/products/:id (PUT) - should update a product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 29.99,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.name).toBe(updateData.name);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.price).toBe(updateData.price);
    });

    it('/products/search (GET) - should search products', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/products/search')
        .query({ q: 'Updated' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/products/category/:category (GET) - should get products by category', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get(`/products/category/${testProduct.category}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/products/:id (DELETE) - should delete a product', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify product is deleted
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(404);
    });

    it('/products (POST) - should fail without authentication', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/products')
        .send(testProduct)
        .expect(401);
    });

    it('/products (POST) - should fail with invalid data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          price: -10, // Invalid: negative price
        })
        .expect(400);
    });
  });
});
