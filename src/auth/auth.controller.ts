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
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserProfileDto,
  RefreshTokenDto,
} from './dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import { User } from './entities/user.entity';

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
    description: 'Create a new user account with email and password',
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
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: LoginDto })
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
  async logout(@CurrentUser() user: User): Promise<{ message: string }> {
    // Update last login timestamp to current time for security tracking
    await this.authService.updateLastLogin(user.id);

    return {
      message: 'Successfully logged out',
    };
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
    } catch (error) {
      return {
        message: `Database connection failed: ${error.message}`,
        userCount: -1,
      };
    }
  }
}
