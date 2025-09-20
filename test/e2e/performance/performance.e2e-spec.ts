/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../../../src/auth/entities/user.entity';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  requestsPerSecond: number;
  totalRequests: number;
  failedRequests: number;
}

describe('Performance Testing E2E - Advanced Metrics', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let testCategories: { id: string; name: string }[] = [];

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
    // Create customer user first (default role)
    const customerData = {
      email: 'perf-customer@test.com',
      password: 'CustomerPassword123!',
      firstName: 'Performance',
      lastName: 'Customer',
    };

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(customerData);

    // Try to login with default admin credentials (assuming seed data)
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@ecommerce.com',
          password: 'AdminPassword123!',
        });

      adminToken = adminLoginResponse.body.data.access_token;
    } catch {
      // If default admin doesn't exist, create a customer and upgrade to admin via direct DB
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'perf-admin@test.com',
        password: 'AdminPassword123!',
        firstName: 'Performance',
        lastName: 'Admin',
      });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'perf-admin@test.com',
          password: 'AdminPassword123!',
        });

      adminToken = loginResponse.body.data.access_token;

      // Directly update user role in database for testing
      await dataSource.query('UPDATE "users" SET role = $1 WHERE email = $2', [
        UserRole.ADMIN,
        'perf-admin@test.com',
      ]);
    }

    // Create test categories
    const categories = ['Electronics', 'Books', 'Clothing', 'Sports', 'Beauty'];
    const categoryPromises = categories.map((name) =>
      request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name,
          slug: name.toLowerCase(),
          description: `${name} category for testing`,
        })
        .catch(() => null),
    );

    const categoryResults = await Promise.allSettled(categoryPromises);
    const createdCategories: { id: string; name: string }[] = [];
    categoryResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.body?.data?.id) {
        createdCategories.push(
          result.value.body.data as { id: string; name: string },
        );
      }
    });

    // Store categories for use in other tests
    testCategories = createdCategories;

    // Create test products in batches
    const batchPromises: Promise<any>[] = [];
    for (let batch = 0; batch < 5; batch++) {
      const batchProducts: Promise<any>[] = [];
      for (let i = 0; i < 20; i++) {
        const productIndex = batch * 20 + i;
        const category =
          createdCategories[productIndex % createdCategories.length];

        if (category) {
          batchProducts.push(
            request(app.getHttpServer())
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: `Performance Product ${productIndex + 1}`,
                slug: `performance-product-${productIndex + 1}`,
                description: `Product for performance testing #${productIndex + 1}`,
                price: Math.round((Math.random() * 999 + 1) * 100) / 100,
                stock: Math.floor(Math.random() * 100) + 1,
                categoryIds: [category.id],
                sku: `PERF-${String(productIndex + 1).padStart(4, '0')}`,
              })
              .catch(() => null),
          );
        }
      }
      batchPromises.push(Promise.allSettled(batchProducts));
    }

    await Promise.all(batchPromises);
    console.log('✅ Performance test data setup completed');
  }

  function calculateMetrics(
    responseTimes: number[],
    errors: string[],
    duration: number,
  ): PerformanceMetrics {
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const totalRequests = responseTimes.length + errors.length;
    const successfulRequests = responseTimes.length;

    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length || 0;
    const minResponseTime = sortedTimes[0] || 0;
    const maxResponseTime = sortedTimes[sortedTimes.length - 1] || 0;
    const p95ResponseTime =
      sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const successRate = (successfulRequests / totalRequests) * 100;
    const requestsPerSecond = totalRequests / (duration / 1000);

    return {
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      successRate,
      requestsPerSecond,
      totalRequests,
      failedRequests: errors.length,
    };
  }

  async function runLoadTest(
    testName: string,
    requestFunction: () => Promise<any>,
    concurrency: number,
    durationMs: number,
  ): Promise<PerformanceMetrics> {
    console.log(`🔥 Starting: ${testName}`);
    console.log(`📊 Concurrency: ${concurrency}, Duration: ${durationMs}ms`);

    const responseTimes: number[] = [];
    const errors: string[] = [];
    const startTime = performance.now();
    const endTime = startTime + durationMs;

    const workers = Array.from({ length: concurrency }, async () => {
      while (performance.now() < endTime) {
        const requestStart = performance.now();
        try {
          await requestFunction();
          const responseTime = performance.now() - requestStart;
          responseTimes.push(responseTime);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }

        // Small delay to prevent overwhelming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    await Promise.all(workers);
    const actualDuration = performance.now() - startTime;
    const metrics = calculateMetrics(responseTimes, errors, actualDuration);

    console.log(`✅ ${testName} completed`);
    console.log(
      `📈 ${metrics.totalRequests} requests, ${metrics.requestsPerSecond.toFixed(2)} req/s, ${metrics.avgResponseTime.toFixed(2)}ms avg`,
    );

    return metrics;
  }

  describe('Search Performance with Detailed Metrics', () => {
    it('should handle product search with comprehensive performance analysis', async () => {
      const searchFunction = () =>
        request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            page: Math.floor(Math.random() * 5) + 1,
            limit: 10,
          })
          .expect(200);

      const metrics = await runLoadTest(
        'Product Search Performance',
        searchFunction,
        8, // 8 concurrent users
        10000, // 10 seconds
      );

      // Performance assertions with detailed metrics
      expect(metrics.successRate).toBeGreaterThanOrEqual(85);
      expect(metrics.avgResponseTime).toBeLessThan(500);
      expect(metrics.p95ResponseTime).toBeLessThan(1000);
      expect(metrics.requestsPerSecond).toBeGreaterThan(5);
      expect(metrics.totalRequests).toBeGreaterThan(30);

      // Log detailed performance metrics
      console.log('📊 Detailed Performance Metrics:');
      console.log(`   Total Requests: ${metrics.totalRequests}`);
      console.log(`   Success Rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   Failed Requests: ${metrics.failedRequests}`);
      console.log(
        `   Average Response Time: ${metrics.avgResponseTime.toFixed(2)}ms`,
      );
      console.log(
        `   Min Response Time: ${metrics.minResponseTime.toFixed(2)}ms`,
      );
      console.log(
        `   Max Response Time: ${metrics.maxResponseTime.toFixed(2)}ms`,
      );
      console.log(
        `   P95 Response Time: ${metrics.p95ResponseTime.toFixed(2)}ms`,
      );
      console.log(
        `   Requests per Second: ${metrics.requestsPerSecond.toFixed(2)}`,
      );
    }, 15000);

    it('should maintain performance with pagination load', async () => {
      const paginationFunction = () => {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        return request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            page: randomPage,
            limit: 20,
          })
          .expect(200);
      };

      const metrics = await runLoadTest(
        'Pagination Load Test',
        paginationFunction,
        6,
        8000,
      );

      expect(metrics.successRate).toBeGreaterThanOrEqual(90);
      expect(metrics.avgResponseTime).toBeLessThan(600);

      console.log('📄 Pagination Performance:');
      console.log(`   Requests: ${metrics.totalRequests}`);
      console.log(`   Success Rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms`);
    }, 12000);
  });

  describe('Memory and Resource Performance', () => {
    it('should track memory usage during sustained load', async () => {
      const initialMemory = process.memoryUsage();

      const sustainedFunction = () =>
        request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({ page: 1, limit: 15 })
          .expect(200);

      const metrics = await runLoadTest(
        'Memory Usage Test',
        sustainedFunction,
        4,
        12000,
      );

      const finalMemory = process.memoryUsage();
      const memoryGrowthMB =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(metrics.successRate).toBeGreaterThanOrEqual(85);
      expect(memoryGrowthMB).toBeLessThan(150); // Memory growth should be reasonable for testing

      console.log('💾 Memory Performance Analysis:');
      console.log(
        `   Initial Heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `   Final Heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`   Memory Growth: ${memoryGrowthMB.toFixed(2)}MB`);
      console.log(`   Requests Processed: ${metrics.totalRequests}`);
      console.log(
        `   RSS Memory: ${(finalMemory.rss / 1024 / 1024).toFixed(2)}MB`,
      );
    }, 18000);
  });

  describe('Authentication Performance Metrics', () => {
    it('should measure authentication endpoint performance', async () => {
      const authFunction = () =>
        request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'perf-admin@test.com',
          password: 'AdminPassword123!',
        });

      const metrics = await runLoadTest(
        'Authentication Performance',
        authFunction,
        3,
        6000,
      );

      expect(metrics.successRate).toBeGreaterThanOrEqual(80);
      expect(metrics.avgResponseTime).toBeLessThan(800);

      console.log('🔐 Authentication Metrics:');
      console.log(`   Login Requests: ${metrics.totalRequests}`);
      console.log(`   Success Rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms`);
    }, 10000);
  });

  describe('High-Volume Data Performance', () => {
    it('should test performance with larger dataset queries', async () => {
      // Create additional products for high-volume testing
      const volumeTestData: Promise<any>[] = [];
      for (let i = 0; i < 50; i++) {
        // Get a random category from created categories
        const randomCategory = testCategories[i % testCategories.length];

        volumeTestData.push(
          request(app.getHttpServer())
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: `Volume Test Product ${i + 1}`,
              slug: `volume-test-product-${i + 1}`,
              description: `High volume test product #${i + 1}`,
              price: Math.round((Math.random() * 500 + 50) * 100) / 100,
              stock: Math.floor(Math.random() * 50) + 1,
              categoryIds: [randomCategory.id],
              sku: `VOL-${String(i + 1).padStart(3, '0')}`,
            })
            .catch(() => null),
        );
      }

      await Promise.allSettled(volumeTestData);

      const volumeSearchFunction = () => {
        const searchTerm = Math.random() > 0.7 ? 'Product' : 'Test';
        return request(app.getHttpServer())
          .get('/api/v1/products/search')
          .query({
            page: Math.floor(Math.random() * 15) + 1,
            limit: 25,
            search: searchTerm,
          })
          .expect(200);
      };

      const metrics = await runLoadTest(
        'High-Volume Search Performance',
        volumeSearchFunction,
        10,
        15000,
      );

      expect(metrics.successRate).toBeGreaterThanOrEqual(70);
      expect(metrics.avgResponseTime).toBeLessThan(800);
      expect(metrics.p95ResponseTime).toBeLessThan(1500);

      console.log('📦 High-Volume Performance:');
      console.log(`   Total Requests: ${metrics.totalRequests}`);
      console.log(`   Success Rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms`);
      console.log(`   P95 Response: ${metrics.p95ResponseTime.toFixed(2)}ms`);
      console.log(
        `   Throughput: ${metrics.requestsPerSecond.toFixed(2)} req/s`,
      );
    }, 25000);
  });
});
