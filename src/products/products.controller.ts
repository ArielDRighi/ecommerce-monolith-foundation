import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService, PaginatedResult } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductSearchDto,
  ProductResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { DebugInterceptor } from '../common/interceptors/debug.interceptor';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==============================
  // ADMIN ONLY ENDPOINTS
  // ==============================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or category not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - product slug already exists',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ): Promise<ProductResponseDto> {
    return this.productsService.createProduct(createProductDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - product slug already exists',
  })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft deletes a product. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.deleteProduct(id);
  }

  // ==============================
  // PUBLIC ENDPOINTS
  // ==============================

  @Get()
  @ApiOperation({
    summary: 'Get all products with pagination',
    description:
      'Get all active products with optional filtering by category and price range. ' +
      'Supports pagination and returns detailed product information.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts at 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products per page (max 100)',
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
    type: String,
    example: 'electronics',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    type: Number,
    example: 500,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 8 },
      },
    },
  })
  async getAllProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    // Ensure minimum values and maximum limits
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));

    return this.productsService.getAllProducts({
      page: safePage,
      limit: safeLimit,
      category,
      minPrice,
      maxPrice,
    });
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular products',
    description:
      'High-performance endpoint to get popular/trending products based on order count and views. ' +
      'Leverages optimized database indexes for fast retrieval.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (max 50)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Popular products retrieved successfully',
    type: [ProductResponseDto],
  })
  async getPopularProducts(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.getPopularProducts(limit);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recently added products',
    description:
      'High-performance endpoint to get recently added products. ' +
      'Leverages optimized database indexes for fast retrieval.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (max 50)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent products retrieved successfully',
    type: [ProductResponseDto],
  })
  async getRecentProducts(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.getRecentProducts(limit);
  }

  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'Get products by category with pagination',
    description:
      'High-performance endpoint to get products by category with pagination. ' +
      'Optimized for category-based browsing using specialized indexes.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Category products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        total: { type: 'number', example: 45 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getProductsByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.productsService.getProductsByCategory(categoryId, page, limit);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get product by slug',
    description:
      'High-performance endpoint to get a product by its slug. ' +
      'Optimized using unique slug index and increments view count automatically.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug (URL-friendly identifier)',
    type: 'string',
    example: 'macbook-pro-16',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or inactive',
  })
  async getProductBySlug(
    @Param('slug') slug: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.getProductBySlugPublic(slug);
  }

  @Get('search')
  @UseInterceptors(DebugInterceptor)
  @ApiOperation({
    summary: 'Search products with filters and pagination',
    description:
      'Publicly accessible endpoint to search and filter products with pagination. ' +
      'Supports text search, category filtering, price range, stock status, and rating filters.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for product name or description',
    type: String,
    example: 'macbook',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Category UUID to filter products',
    type: String,
    format: 'uuid',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    type: Number,
    example: 30,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    type: Number,
    example: 3000,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter only products in stock',
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Minimum rating filter (0-5)',
    type: Number,
    example: 4,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'rating', 'popularity', 'viewCount'],
    example: 'price',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDto' },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 8 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid query parameters',
  })
  async searchProducts(
    @Query() searchDto: ProductSearchDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.productsService.searchProductsPublic(searchDto);
  }

  // ==============================
  // CATEGORY ENDPOINTS (PUBLIC & ADMIN)
  // ==============================

  @Get('categories')
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Publicly accessible endpoint to get all active categories, sorted by name.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async getAllCategories(): Promise<CategoryResponseDto[]> {
    return this.productsService.getAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Publicly accessible endpoint to get a specific category by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or inactive',
  })
  async getCategoryById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    return this.productsService.getCategoryById(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Creates a new product category. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - category slug already exists',
  })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates an existing category. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - category slug already exists',
  })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.productsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Soft deletes a category. Cannot delete if category contains products. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - category contains products',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions (requires ADMIN role)',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.deleteCategory(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Publicly accessible endpoint to get a specific product by its ID. ' +
      'Increments view count automatically.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or inactive',
  })
  async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.getProductById(id);
  }
}
