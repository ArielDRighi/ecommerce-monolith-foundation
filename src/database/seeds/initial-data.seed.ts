import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Category } from '../../products/entities/category.entity';
import { Product } from '../../products/entities/product.entity';

export async function runSeeds(dataSource: DataSource) {
  console.log('🌱 Running seeds...');

  // Repositories
  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const productRepository = dataSource.getRepository(Product);

  // Create admin user
  const adminExists = await userRepository.findOne({
    where: { email: 'admin@ecommerce.local' },
  });

  if (!adminExists) {
    const adminUser = userRepository.create({
      email: 'admin@ecommerce.local',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      emailVerifiedAt: new Date(),
    });
    await userRepository.save(adminUser);
    console.log('✅ Admin user created');
  }

  // Create test customer
  const customerExists = await userRepository.findOne({
    where: { email: 'customer@ecommerce.local' },
  });

  if (!customerExists) {
    const customerUser = userRepository.create({
      email: 'customer@ecommerce.local',
      passwordHash: await bcrypt.hash('customer123', 12),
      role: UserRole.CUSTOMER,
      firstName: 'Test',
      lastName: 'Customer',
      emailVerifiedAt: new Date(),
    });
    await userRepository.save(customerUser);
    console.log('✅ Test customer created');
  }

  // Create categories
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      sortOrder: 1,
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      sortOrder: 2,
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Books and literature',
      sortOrder: 3,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      sortOrder: 4,
    },
  ];

  for (const categoryData of categories) {
    const exists = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });
    if (!exists) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`✅ Category "${categoryData.name}" created`);
    }
  }

  // Create sample products
  const adminUser = await userRepository.findOne({
    where: { email: 'admin@ecommerce.local' },
  });
  const electronicsCategory = await categoryRepository.findOne({
    where: { slug: 'electronics' },
  });
  const clothingCategory = await categoryRepository.findOne({
    where: { slug: 'clothing' },
  });

  if (adminUser && electronicsCategory && clothingCategory) {
    const products = [
      {
        name: 'MacBook Pro 16"',
        slug: 'macbook-pro-16',
        description: 'Apple MacBook Pro with M2 chip, 16-inch display',
        price: 2499.99,
        stock: 15,
        sku: 'MBP16M2',
        categories: [electronicsCategory],
        createdBy: adminUser,
        createdById: adminUser.id,
        attributes: {
          brand: 'Apple',
          screen_size: '16 inches',
          processor: 'M2',
          ram: '16GB',
          storage: '512GB SSD',
        },
      },
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone with A17 Pro chip and titanium design',
        price: 999.99,
        stock: 25,
        sku: 'IP15PRO',
        categories: [electronicsCategory],
        createdBy: adminUser,
        createdById: adminUser.id,
        attributes: {
          brand: 'Apple',
          screen_size: '6.1 inches',
          storage: '128GB',
          color: 'Natural Titanium',
        },
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-tshirt',
        description: 'High-quality 100% organic cotton t-shirt',
        price: 29.99,
        stock: 100,
        sku: 'PCOT001',
        categories: [clothingCategory],
        createdBy: adminUser,
        createdById: adminUser.id,
        attributes: {
          material: '100% Organic Cotton',
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['White', 'Black', 'Navy'],
        },
      },
    ];

    for (const productData of products) {
      const exists = await productRepository.findOne({
        where: { slug: productData.slug },
      });
      if (!exists) {
        const product = productRepository.create(productData);
        await productRepository.save(product);
        console.log(`✅ Product "${productData.name}" created`);
      }
    }
  }

  console.log('🎉 Seeding completed!');
}
