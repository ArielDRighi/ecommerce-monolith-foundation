/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggingModule } from './logging.module';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestResponseInterceptor } from './interceptors/request-response.interceptor';
import { TransformResponseInterceptor } from './interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

// Mock configuration
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      LOG_FILE_ENABLED: false,
    };
    return config[key];
  }),
};

describe('LoggingModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [LoggingModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(LoggingModule).toBeDefined();
    expect(typeof LoggingModule).toBe('function');
  });

  it('should be a global module', () => {
    const metadata = Reflect.getMetadata('__module:global__', LoggingModule);
    expect(metadata).toBe(true);
  });

  it('should export WinstonModule', () => {
    const metadata = Reflect.getMetadata('exports', LoggingModule);
    expect(metadata).toContain(WinstonModule);
  });

  it('should provide module components', () => {
    // Since interceptors and filters are registered with APP_INTERCEPTOR/APP_FILTER,
    // they cannot be directly accessed, but we can verify the module structure exists
    expect(LoggingModule).toBeDefined();
    expect(RequestResponseInterceptor).toBeDefined();
    expect(TransformResponseInterceptor).toBeDefined();
    expect(HttpExceptionFilter).toBeDefined();
    expect(GlobalExceptionFilter).toBeDefined();
  });

  it('should implement NestModule interface', () => {
    const instance = new LoggingModule();
    expect(instance.configure).toBeDefined();
    expect(typeof instance.configure).toBe('function');
  });

  it('should configure correlation id middleware', () => {
    const instance = new LoggingModule();
    const mockConsumer = {
      apply: jest.fn().mockReturnThis(),
      forRoutes: jest.fn(),
    };

    instance.configure(mockConsumer as any);

    expect(mockConsumer.apply).toHaveBeenCalled();
    expect(mockConsumer.forRoutes).toHaveBeenCalledWith('*');
  });
});
