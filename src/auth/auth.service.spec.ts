import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  // Test data - create a partial mock instead of full User
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: undefined,
    lastLoginAt: undefined,
    emailVerifiedAt: undefined,
    products: [],
    fullName: 'John Doe',
    isAdmin: false,
    isCustomer: true,
  } as any as User;

  const mockRegisterDto: RegisterDto = {
    email: 'newuser@example.com',
    password: 'Password123!',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+0987654321',
  };

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'Password123!',
  };

  const mockRepositoryMethods = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockJwtMethods = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigMethods = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositoryMethods,
        },
        {
          provide: JwtService,
          useValue: mockJwtMethods,
        },
        {
          provide: ConfigService,
          useValue: mockConfigMethods,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mockSalt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    configService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        const configs = {
          BCRYPT_SALT_ROUNDS: '12',
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return configs[key as keyof typeof configs] || defaultValue;
      },
    );

    jwtService.signAsync.mockResolvedValue('mock-jwt-token');
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockRegisterDto.email },
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockRegisterDto.password,
        'mockSalt',
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        passwordHash: 'hashedPassword123',
        firstName: mockRegisterDto.firstName,
        lastName: mockRegisterDto.lastName,
        phone: mockRegisterDto.phone,
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database unique constraint violations', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockRejectedValue({ code: '23505' }); // PostgreSQL unique violation

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow non-constraint database errors', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      const dbError = new Error('Database connection failed');
      userRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(dbError);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email, isActive: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.passwordHash,
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser('test@example.com', 'password');

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateUserById', () => {
    it('should return user for valid ID', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUserById('test-user-id');

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id', isActive: true },
      });
    });

    it('should return null for non-existent user ID', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid user ID', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.getProfile('test-user-id');

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        phone: mockUser.phone,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      // Arrange
      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };
      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshToken('valid-refresh-token');

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user no longer exists', async () => {
      // Arrange
      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };
      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with valid current password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await service.changePassword(
        'test-user-id',
        'currentPassword',
        'newPassword',
      );

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'currentPassword',
        mockUser.passwordHash,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 'mockSalt');
      expect(userRepository.update).toHaveBeenCalledWith('test-user-id', {
        passwordHash: 'hashedPassword123',
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePassword(
          'non-existent-id',
          'currentPassword',
          'newPassword',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.changePassword('test-user-id', 'wrongPassword', 'newPassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deactivateUser', () => {
    it('should successfully deactivate an existing user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      await service.deactivateUser('test-user-id');

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith('test-user-id', {
        isActive: false,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deactivateUser('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserCount', () => {
    it('should return the total number of users', async () => {
      // Arrange
      userRepository.count.mockResolvedValue(42);

      // Act
      const result = await service.getUserCount();

      // Assert
      expect(result).toBe(42);
      expect(userRepository.count).toHaveBeenCalled();
    });
  });

  describe('parseExpirationToSeconds (private method testing via public interface)', () => {
    it('should correctly parse different time units through token generation', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Test different expiration formats
      const testCases = [
        { config: '30s', expected: 30 },
        { config: '15m', expected: 900 },
        { config: '2h', expected: 7200 },
        { config: '1d', expected: 86400 },
      ];

      for (const testCase of testCases) {
        configService.get.mockImplementation((key: string) => {
          if (key === 'JWT_ACCESS_EXPIRATION') return testCase.config;
          return key === 'BCRYPT_SALT_ROUNDS' ? '12' : 'default';
        });

        // Act
        const result = await service.register(mockRegisterDto);

        // Assert
        expect(result.expires_in).toBe(testCase.expected);
      }
    });
  });

  describe('generateTokensForUser', () => {
    it('should generate tokens for a validated user', async () => {
      // Act
      const result = await service.generateTokensForUser(mockUser);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      // Act
      await service.updateLastLogin('test-user-id');

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith('test-user-id', {
        updatedAt: expect.any(Date),
      });
    });
  });
});
