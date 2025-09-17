import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    isActive: true,
    passwordHash: 'hashed-password',
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
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user when validation succeeds', async () => {
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle empty credentials', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle invalid email format', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('invalid-email', password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
