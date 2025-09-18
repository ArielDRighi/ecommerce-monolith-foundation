import jwtConfig from './jwt.config';

describe('JWT Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no environment variables are set', () => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_EXPIRATION;
    delete process.env.JWT_REFRESH_EXPIRATION;

    const config = jwtConfig();

    expect(config).toEqual({
      secret: 'default-secret',
      refreshSecret: 'default-refresh-secret',
      accessTokenExpiration: '15m',
      refreshTokenExpiration: '7d',
    });
  });

  it('should use environment variables when provided', () => {
    process.env.JWT_ACCESS_SECRET = 'my-access-secret';
    process.env.JWT_REFRESH_SECRET = 'my-refresh-secret';
    process.env.JWT_ACCESS_EXPIRATION = '30m';
    process.env.JWT_REFRESH_EXPIRATION = '14d';

    const config = jwtConfig();

    expect(config).toEqual({
      secret: 'my-access-secret',
      refreshSecret: 'my-refresh-secret',
      accessTokenExpiration: '30m',
      refreshTokenExpiration: '14d',
    });
  });

  it('should handle partial environment variables', () => {
    process.env.JWT_ACCESS_SECRET = 'only-access-secret';
    process.env.JWT_ACCESS_EXPIRATION = '1h';
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_EXPIRATION;

    const config = jwtConfig();

    expect(config).toEqual({
      secret: 'only-access-secret',
      refreshSecret: 'default-refresh-secret',
      accessTokenExpiration: '1h',
      refreshTokenExpiration: '7d',
    });
  });

  it('should handle empty string environment variables', () => {
    process.env.JWT_ACCESS_SECRET = '';
    process.env.JWT_REFRESH_SECRET = '';
    process.env.JWT_ACCESS_EXPIRATION = '';
    process.env.JWT_REFRESH_EXPIRATION = '';

    const config = jwtConfig();

    expect(config).toEqual({
      secret: 'default-secret',
      refreshSecret: 'default-refresh-secret',
      accessTokenExpiration: '15m',
      refreshTokenExpiration: '7d',
    });
  });

  it('should return consistent configuration on multiple calls', () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';

    const config1 = jwtConfig();
    const config2 = jwtConfig();

    expect(config1).toEqual(config2);
    expect(config1.secret).toBe('test-secret');
    expect(config2.secret).toBe('test-secret');
  });
});
