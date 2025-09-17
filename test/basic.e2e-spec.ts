import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

// Import only core modules to avoid logging issues
import { AuthModule } from '../src/auth/auth.module';
import { ProductsModule } from '../src/products/products.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

describe('Basic E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        JwtModule.register({
          global: true,
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });

    it('/auth/test (GET) - should test basic connectivity', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/auth/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Products API', () => {
    it('/products (GET) - should get products list', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/products/categories (GET) - should get categories', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/products/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'basic-test@example.com',
      password: 'TestPassword123!',
      firstName: 'Basic',
      lastName: 'Test',
    };

    it('/auth/register (POST) - should register user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
    });

    it('/auth/register (POST) - should fail with duplicate email', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('/auth/login (POST) - should login successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
    });
  });
});
