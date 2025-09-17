import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.email = 'test@example.com';
    user.passwordHash = 'hashedPassword123';
    user.role = UserRole.CUSTOMER;
  });

  describe('constructor', () => {
    it('should create a new user instance', () => {
      const newUser = new User();
      expect(newUser).toBeInstanceOf(User);
    });
  });

  describe('fullName getter', () => {
    it('should return full name when both firstName and lastName are provided', () => {
      user.firstName = 'John';
      user.lastName = 'Doe';

      expect(user.fullName).toBe('John Doe');
    });

    it('should return only firstName when lastName is not provided', () => {
      user.firstName = 'John';
      user.lastName = undefined;

      expect(user.fullName).toBe('John');
    });

    it('should return only lastName when firstName is not provided', () => {
      user.firstName = undefined;
      user.lastName = 'Doe';

      expect(user.fullName).toBe('Doe');
    });

    it('should return empty string when both firstName and lastName are not provided', () => {
      user.firstName = undefined;
      user.lastName = undefined;

      expect(user.fullName).toBe('');
    });

    it('should handle empty strings for firstName and lastName', () => {
      user.firstName = '';
      user.lastName = '';

      expect(user.fullName).toBe('');
    });

    it('should handle null-like values for firstName and lastName', () => {
      user.firstName = undefined;
      user.lastName = undefined;

      expect(user.fullName).toBe('');
    });

    it('should trim and join names correctly with spaces', () => {
      user.firstName = 'John';
      user.lastName = 'Doe Smith';

      expect(user.fullName).toBe('John Doe Smith');
    });
  });

  describe('isAdmin getter', () => {
    it('should return true when user role is ADMIN', () => {
      user.role = UserRole.ADMIN;

      expect(user.isAdmin).toBe(true);
    });

    it('should return false when user role is CUSTOMER', () => {
      user.role = UserRole.CUSTOMER;

      expect(user.isAdmin).toBe(false);
    });
  });

  describe('isCustomer getter', () => {
    it('should return true when user role is CUSTOMER', () => {
      user.role = UserRole.CUSTOMER;

      expect(user.isCustomer).toBe(true);
    });

    it('should return false when user role is ADMIN', () => {
      user.role = UserRole.ADMIN;

      expect(user.isCustomer).toBe(false);
    });
  });

  describe('properties', () => {
    it('should set and get email correctly', () => {
      const email = 'user@example.com';
      user.email = email;

      expect(user.email).toBe(email);
    });

    it('should set and get passwordHash correctly', () => {
      const hash = 'hashedPassword456';
      user.passwordHash = hash;

      expect(user.passwordHash).toBe(hash);
    });

    it('should set and get role correctly', () => {
      user.role = UserRole.ADMIN;
      expect(user.role).toBe(UserRole.ADMIN);

      user.role = UserRole.CUSTOMER;
      expect(user.role).toBe(UserRole.CUSTOMER);
    });

    it('should set and get optional properties correctly', () => {
      user.firstName = 'Jane';
      user.lastName = 'Smith';
      user.phone = '+1234567890';

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.phone).toBe('+1234567890');
    });

    it('should handle date properties correctly', () => {
      const loginDate = new Date('2023-12-01');
      const verificationDate = new Date('2023-11-15');

      user.lastLoginAt = loginDate;
      user.emailVerifiedAt = verificationDate;

      expect(user.lastLoginAt).toBe(loginDate);
      expect(user.emailVerifiedAt).toBe(verificationDate);
    });
  });

  describe('UserRole enum', () => {
    it('should have correct enum values', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.CUSTOMER).toBe('customer');
    });
  });
});
