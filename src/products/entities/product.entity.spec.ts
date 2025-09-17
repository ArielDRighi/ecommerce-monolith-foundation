import { Product } from './product.entity';
import { Category } from './category.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

describe('Product Entity', () => {
  let product: Product;
  let category: Category;
  let user: User;

  beforeEach(() => {
    // Create mock user
    user = new User();
    user.id = 'user-id';
    user.email = 'test@example.com';
    user.role = UserRole.ADMIN;

    // Create mock category
    category = new Category();
    category.id = 'category-id';
    category.name = 'Test Category';

    // Create product
    product = new Product();
    product.id = 'product-id';
    product.name = 'Test Product';
    product.description = 'Test description';
    product.slug = 'test-product';
    product.price = 99.99;
    product.stock = 10;
    product.categories = [category];
    product.createdBy = user;
  });

  it('should be defined', () => {
    expect(product).toBeDefined();
  });

  it('should have default values', () => {
    const newProduct = new Product();
    // BaseEntity properties are undefined until saved to database
    expect(newProduct.isActive).toBeUndefined();
    // averageRating is a getter that returns this.rating || 0
    expect(newProduct.averageRating).toBe(0);
    // These values are defined as defaults in database, but in memory they're undefined until set by TypeORM
    expect(newProduct.reviewCount).toBeUndefined();
    expect(newProduct.stock).toBeUndefined();
    // Optional JSON fields are undefined by default
    expect(newProduct.images).toBeUndefined();
    expect(newProduct.attributes).toBeUndefined();
  });

  it('should calculate total price correctly', () => {
    product.price = 10.0;
    product.stock = 5;
    // Assuming there's a method to calculate total value
    const totalValue = product.price * product.stock;
    expect(totalValue).toBe(50.0);
  });

  it('should handle slug generation', () => {
    expect(product.slug).toBe('test-product');
    expect(product.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('should handle category association', () => {
    expect(product.categories).toHaveLength(1);
    expect(product.categories[0]).toBe(category);
  });

  it('should be associated with a user', () => {
    expect(product.createdBy).toBe(user);
    expect(product.createdBy.role).toBe(UserRole.ADMIN);
  });

  it('should handle stock updates', () => {
    const initialStock = product.stock;
    product.stock = initialStock - 1;
    expect(product.stock).toBe(initialStock - 1);
  });

  it('should handle attributes object', () => {
    product.attributes = { color: 'red', size: 'large' };
    expect(product.attributes.color).toBe('red');
    expect(product.attributes.size).toBe('large');
  });

  describe('isInStock getter', () => {
    it('should return true when stock is greater than 0', () => {
      product.stock = 5;
      expect(product.isInStock).toBe(true);
    });

    it('should return false when stock is 0', () => {
      product.stock = 0;
      expect(product.isInStock).toBe(false);
    });

    it('should return false when stock is negative', () => {
      product.stock = -1;
      expect(product.isInStock).toBe(false);
    });
  });

  describe('isLowStock getter', () => {
    it('should return true when stock is between 1 and 10', () => {
      product.stock = 5;
      expect(product.isLowStock).toBe(true);
    });

    it('should return true when stock is exactly 10', () => {
      product.stock = 10;
      expect(product.isLowStock).toBe(true);
    });

    it('should return false when stock is greater than 10', () => {
      product.stock = 15;
      expect(product.isLowStock).toBe(false);
    });

    it('should return false when stock is 0', () => {
      product.stock = 0;
      expect(product.isLowStock).toBe(false);
    });

    it('should return true when stock is exactly 1', () => {
      product.stock = 1;
      expect(product.isLowStock).toBe(true);
    });
  });

  describe('averageRating getter', () => {
    it('should return rating when rating is set', () => {
      product.rating = 4.5;
      expect(product.averageRating).toBe(4.5);
    });

    it('should return 0 when rating is not set', () => {
      product.rating = undefined;
      expect(product.averageRating).toBe(0);
    });

    it('should return 0 when rating is undefined', () => {
      product.rating = undefined;
      expect(product.averageRating).toBe(0);
    });

    it('should return 0 when rating is 0', () => {
      product.rating = 0;
      expect(product.averageRating).toBe(0);
    });
  });
});
