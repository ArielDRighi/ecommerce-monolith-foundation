import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  RefreshTokenDto,
  AuthResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { UserRole, User } from './entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    isActive: true,
    passwordHash: 'hashed-password',
    phone: '+1234567890',
    fullName: 'Test User',
    isAdmin: false,
    isCustomer: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: [],
  } as User;

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'jwt.token.here',
    refresh_token: 'refresh.token.here',
    expires_in: 3600,
    token_type: 'Bearer',
    user: {
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.role,
      isActive: mockUser.isActive,
    },
  };

  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    updateLastLogin: jest.fn(),
    getUserCount: jest.fn(),
    getProfile: jest.fn(),
    generateTokensForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle registration conflict', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle invalid registration data', async () => {
      authService.register.mockRejectedValue(
        new BadRequestException('Invalid data'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully', async () => {
      authService.generateTokensForUser.mockResolvedValue(mockAuthResponse);
      authService.updateLastLogin.mockResolvedValue(undefined);

      const mockRequest = { user: mockUser };
      const result = await controller.login(mockRequest as any);

      expect(authService.generateTokensForUser).toHaveBeenCalledWith(mockUser);
      expect(authService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle login failure', async () => {
      authService.generateTokensForUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      const mockRequest = { user: mockUser };
      await expect(controller.login(mockRequest as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refresh_token: 'refresh.token.here',
    };

    it('should refresh token successfully', async () => {
      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle invalid refresh token', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      authService.updateLastLogin.mockResolvedValue(undefined);

      const result = await controller.logout(mockUser);

      expect(authService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const userProfile: UserProfileDto = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        phone: mockUser.phone,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      authService.getProfile.mockResolvedValue(userProfile);

      const result = await controller.getProfile(mockUser);

      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(userProfile);
    });
  });

  describe('testDatabase', () => {
    it('should test database connection successfully', async () => {
      authService.getUserCount.mockResolvedValue(5);

      const result = await controller.testDatabase();

      expect(authService.getUserCount).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Database connection successful',
        userCount: 5,
      });
    });

    it('should handle database connection error', async () => {
      authService.getUserCount.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await controller.testDatabase();

      expect(result).toEqual({
        message: 'Database connection failed: Connection failed',
        userCount: -1,
      });
    });

    it('should handle unknown error', async () => {
      authService.getUserCount.mockRejectedValue('Unknown error');

      const result = await controller.testDatabase();

      expect(result).toEqual({
        message: 'Database connection failed: Unknown error',
        userCount: -1,
      });
    });
  });
});
