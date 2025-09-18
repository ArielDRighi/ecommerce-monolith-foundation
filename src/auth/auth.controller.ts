import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ValidationPipe,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserProfileDto,
  RefreshTokenDto,
} from './dto';
import { LocalAuthGuard, JwtAuthGuard, RolesGuard } from './guards';
import { CurrentUser, Roles } from './decorators';
import { User, UserRole } from './entities/user.entity';

interface RequestWithUser {
  user: User;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email and password. Only admin users can create admin accounts.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Only admin users can create admin accounts',
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @CurrentUser() requestingUser?: User,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, requestingUser);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Use admin@ecommerce.local / admin123 for admin access.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: {
        summary: 'Admin Login',
        description: 'Use these credentials to test admin-only endpoints',
        value: {
          email: 'admin@ecommerce.local',
          password: 'admin123',
        },
      },
      customer: {
        summary: 'Customer Login (if available)',
        description: 'Example customer credentials',
        value: {
          email: 'customer@ecommerce.local',
          password: 'customer123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
    // At this point, user has been validated by LocalStrategy
    const user = req.user;

    // Generate tokens directly without re-validating
    const tokens = await this.authService.generateTokensForUser(user);

    // Update last login timestamp
    await this.authService.updateLastLogin(user.id);

    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body(ValidationPipe) refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing token',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user (client should discard tokens)',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully logged out',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing token',
  })
  async logout(
    @CurrentUser() user: User,
    @Req() request: { headers?: { authorization?: string } },
  ): Promise<{ message: string }> {
    // Extract token from Authorization header
    const authHeader = request.headers?.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
      await this.authService.logout(user.id, token);
    }

    return {
      message: 'Successfully logged out',
    };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description:
      'Retrieve all users with pagination support. Only accessible by admin users.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of users per page (max 100)',
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserProfileDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: UserProfileDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 20));

    return this.authService.getAllUsers({
      page: pageNum,
      limit: limitNum,
    });
  }

  /**
   * Test endpoint to verify database connectivity
   */
  @Get('test')
  @ApiOperation({ summary: 'Test database connectivity' })
  @ApiResponse({
    status: 200,
    description: 'Database connection test result',
  })
  async testDatabase(): Promise<{ message: string; userCount: number }> {
    try {
      // Just count users to test database connectivity
      const userCount = await this.authService.getUserCount();
      return {
        message: 'Database connection successful',
        userCount,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        message: `Database connection failed: ${errorMessage}`,
        userCount: -1,
      };
    }
  }
}
