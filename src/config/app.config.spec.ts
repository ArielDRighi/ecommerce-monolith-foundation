import appConfig from './app.config';

describe('App Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no environment variables are set', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.API_PREFIX;
    delete process.env.CORS_ORIGIN;
    delete process.env.SWAGGER_ENABLED;
    delete process.env.SWAGGER_PATH;

    const config = appConfig();

    expect(config).toEqual({
      port: 3000,
      environment: 'development',
      apiPrefix: 'api/v1',
      corsOrigin: ['http://localhost:3000'],
      swaggerEnabled: false,
      swaggerPath: 'api/docs',
    });
  });

  it('should use environment variables when provided', () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.API_PREFIX = 'api/v2';
    process.env.CORS_ORIGIN = 'http://example.com,https://app.example.com';
    process.env.SWAGGER_ENABLED = 'true';
    process.env.SWAGGER_PATH = 'docs';

    const config = appConfig();

    expect(config).toEqual({
      port: 8080,
      environment: 'production',
      apiPrefix: 'api/v2',
      corsOrigin: ['http://example.com', 'https://app.example.com'],
      swaggerEnabled: true,
      swaggerPath: 'docs',
    });
  });

  it('should parse port as integer', () => {
    process.env.PORT = '9000';

    const config = appConfig();

    expect(config.port).toBe(9000);
    expect(typeof config.port).toBe('number');
  });

  it('should handle invalid port value gracefully', () => {
    process.env.PORT = 'invalid';

    const config = appConfig();

    expect(config.port).toBeNaN();
  });

  it('should split CORS_ORIGIN by comma', () => {
    process.env.CORS_ORIGIN =
      'http://localhost:3000,http://localhost:4200,https://myapp.com';

    const config = appConfig();

    expect(config.corsOrigin).toEqual([
      'http://localhost:3000',
      'http://localhost:4200',
      'https://myapp.com',
    ]);
  });

  it('should handle empty CORS_ORIGIN', () => {
    process.env.CORS_ORIGIN = '';

    const config = appConfig();

    expect(config.corsOrigin).toEqual(['']);
  });

  it('should handle single CORS_ORIGIN without comma', () => {
    process.env.CORS_ORIGIN = 'https://single-origin.com';

    const config = appConfig();

    expect(config.corsOrigin).toEqual(['https://single-origin.com']);
  });

  it('should set swagger enabled to false when not "true"', () => {
    process.env.SWAGGER_ENABLED = 'false';

    const config = appConfig();

    expect(config.swaggerEnabled).toBe(false);
  });

  it('should set swagger enabled to false when undefined', () => {
    delete process.env.SWAGGER_ENABLED;

    const config = appConfig();

    expect(config.swaggerEnabled).toBe(false);
  });
});
