/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    isActive: true,
    passwordHash: 'hashed-password',
    isDeleted: false,
    isRecent: false,
    get fullName() {
      return 'Test User';
    },
    get isAdmin() {
      return false;
    },
    get isCustomer() {
      return true;
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
  } as User;

  const mockAuthService = {
    validateUserById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);

    // Mock JWT secret
    mockConfigService.get.mockReturnValue('test-secret');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = {
      sub: '1',
      email: 'test@example.com',
      role: UserRole.CUSTOMER,
    };

    it('should return user when validation succeeds', async () => {
      authService.validateUserById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.validateUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      authService.validateUserById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUserById).toHaveBeenCalledWith('1');
    });

    it('should return user even if inactive (business logic in other layers)', async () => {
      const inactiveUser = { ...mockUser, isActive: false } as User;
      authService.validateUserById.mockResolvedValue(inactiveUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(inactiveUser);
    });

    it('should handle invalid payload', async () => {
      const invalidPayload = { sub: '', email: '', role: UserRole.CUSTOMER };
      authService.validateUserById.mockResolvedValue(null);

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
