import { Category } from './category.entity';
import { Product } from './product.entity';

describe('Category Entity', () => {
  let category: Category;

  beforeEach(() => {
    category = new Category();
    category.id = 'category-id';
    category.name = 'Test Category';
    category.description = 'Test category description';
    category.slug = 'test-category';
    category.sortOrder = 1;
    category.metadata = { color: 'blue' };
  });

  it('should be defined', () => {
    expect(category).toBeDefined();
  });

  it('should have default values', () => {
    const newCategory = new Category();
    // BaseEntity properties are undefined until saved to database
    expect(newCategory.isActive).toBeUndefined();
    expect(newCategory.description).toBeUndefined();
    expect(newCategory.imageUrl).toBeUndefined();
    expect(newCategory.metadata).toBeUndefined();
    // sortOrder is defined as default: 0 in database, but in memory it's undefined
    expect(newCategory.sortOrder).toBeUndefined();
  });

  it('should handle slug validation', () => {
    expect(category.slug).toBe('test-category');
    expect(category.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('should associate with products', () => {
    const product = new Product();
    product.id = 'product-id';
    product.name = 'Test Product';

    category.products = [product];

    expect(category.products).toHaveLength(1);
    expect(category.products[0]).toBe(product);
  });

  it('should calculate product count', () => {
    const product1 = new Product();
    const product2 = new Product();

    category.products = [product1, product2];

    expect(category.productCount).toBe(2);
  });

  it('should handle empty products array', () => {
    category.products = [];
    expect(category.productCount).toBe(0);
  });

  it('should handle undefined products', () => {
    const newCategory = new Category();
    expect(newCategory.productCount).toBe(0);
  });

  it('should handle metadata', () => {
    const metadata = { color: 'red', priority: 1 };
    category.metadata = metadata;

    expect(category.metadata).toEqual(metadata);
    expect(category.metadata?.color).toBe('red');
    expect(category.metadata?.priority).toBe(1);
  });

  it('should handle sort order', () => {
    category.sortOrder = 5;
    expect(category.sortOrder).toBe(5);
  });

  it('should handle image URL', () => {
    const imageUrl = 'https://example.com/image.jpg';
    category.imageUrl = imageUrl;
    expect(category.imageUrl).toBe(imageUrl);
  });
});
