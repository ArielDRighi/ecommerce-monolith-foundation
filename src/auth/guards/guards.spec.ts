import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../entities/user.entity';

describe('Auth Guards', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    role: UserRole.CUSTOMER,
    firstName: 'Test',
    lastName: 'User',
  };

  const mockAdminUser = {
    id: 'admin-id-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  };

  const mockExecutionContext: Partial<ExecutionContext> = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: mockUser,
      }),
      getResponse: jest.fn().mockReturnValue({}),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('RolesGuard', () => {
    it('should be defined', () => {
      expect(rolesGuard).toBeDefined();
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const canActivate = rolesGuard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(canActivate).toBe(true);
    });

    it('should allow access when user has required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.CUSTOMER]);

      const canActivate = rolesGuard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(canActivate).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() =>
        rolesGuard.canActivate(mockExecutionContext as ExecutionContext),
      ).toThrow(ForbiddenException);
    });

    it('should allow admin access when admin role is required', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const adminContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockAdminUser,
          }),
          getResponse: jest.fn().mockReturnValue({}),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      const canActivate = rolesGuard.canActivate(
        adminContext as ExecutionContext,
      );

      expect(canActivate).toBe(true);
    });

    it('should throw ForbiddenException when user is not present', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.CUSTOMER]);

      const noUserContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
          getResponse: jest.fn().mockReturnValue({}),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      expect(() =>
        rolesGuard.canActivate(noUserContext as ExecutionContext),
      ).toThrow(ForbiddenException);
    });
  });
});
