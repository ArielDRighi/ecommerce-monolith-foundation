import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('Authentication E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Set global prefix to match main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth (Authentication)', () => {
    const uniqueId = uuidv4().substring(0, 8);
    const testUser = {
      email: `test-e2e-${uniqueId}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('/api/v1/auth/register (POST) - should register a new user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('access_token');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('user');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data.user.email).toBe(testUser.email);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      authToken = response.body.data.access_token;
    });

    it('/api/v1/auth/register (POST) - should fail with duplicate email', async () => {
      // Create a unique user for this test to avoid conflicts with parallel execution
      const uniqueId = uuidv4().substring(0, 8); // Use first 8 chars of UUID for readability
      const duplicateTestUser = {
        email: `duplicate-test-${uniqueId}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Duplicate',
        lastName: 'Test',
      };

      // First, register a user successfully
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(duplicateTestUser)
        .expect(201);

      // Then, try to register the same user again - should fail with 409
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(duplicateTestUser)
        .expect(409);
    });

    it('/api/v1/auth/register (POST) - should fail with invalid data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          firstName: '',
        })
        .expect(400);
    });

    it('/api/v1/auth/login (POST) - should login with valid credentials', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('access_token');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('user');
    });

    it('/api/v1/auth/login (POST) - should fail with invalid credentials', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/api/v1/auth/profile (GET) - should get user profile with valid token', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data.email).toBe(testUser.email);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data.firstName).toBe(testUser.firstName);
    });

    it('/api/v1/auth/profile (GET) - should fail without token', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('/api/v1/auth/profile (GET) - should fail with invalid token', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('/api/v1/auth/logout (POST) - should logout successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data.message).toBe('Successfully logged out');
    });

    it('/api/v1/auth/test (GET) - should test database connectivity', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/test')
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('message');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.data).toHaveProperty('userCount');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(typeof response.body.data.userCount).toBe('number');
    });
  });
});
