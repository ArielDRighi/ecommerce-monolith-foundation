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
  ProductSortBy,
  SortOrder,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

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
    status: 409,
    description: 'Conflict - product with this slug already exists',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ): Promise<ProductResponseDto> {
    return this.productsService.createProduct(createProductDto, user);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all products for admin (including inactive)',
    description:
      'Get all products with admin-specific information including inactive products, ' +
      'advanced filtering, and extended metadata. Supports pagination and filtering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for name and description',
    example: 'laptop',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
    example: 'electronics',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    example: 100,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    example: 1000,
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'updatedAt', 'stock', 'rating'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductResponseDto,
    isArray: true,
  })
  async getProductsAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: ProductSortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const searchDto: ProductSearchDto = {
      page,
      limit,
      search,
      categoryId: category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    };

    return this.productsService.searchProducts(searchDto);
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
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - product with this slug already exists',
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
    summary: 'Delete a product (soft delete)',
    description:
      'Performs a soft delete on a product. Requires ADMIN role. ' +
      'The product will be marked as deleted but data will be preserved.',
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
    summary: 'Get all active products with filtering',
    description:
      'Get all active products with optional filtering by category and price range. ' +
      'Supports pagination and sorting. Optimized for public consumption.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for name and description',
    example: 'laptop',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
    example: 'electronics',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    example: 100,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    example: 1000,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'rating', 'popularity'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductResponseDto,
    isArray: true,
  })
  async getProductsPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: ProductSortBy,
    @Query('sortOrder') sortOrder?: SortOrder,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const searchDto: ProductSearchDto = {
      page,
      limit,
      search,
      categoryId: category,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    };

    return this.productsService.searchProductsPublic(searchDto);
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
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'rating'],
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: ProductResponseDto,
    isArray: true,
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
      'Publicly accessible endpoint to get a product by its slug. ' +
      'Increments view count automatically. SEO-friendly endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    type: 'string',
    example: 'laptop-gaming-asus-rog-2024',
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
    return this.productsService.getProductBySlug(slug);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search products with advanced filtering',
    description:
      'Advanced product search with full-text search, filtering, and sorting. ' +
      'Optimized for search performance using specialized indexes and pagination.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query for product name and description',
    example: 'gaming laptop',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
    example: 'electronics',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    example: 500,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    example: 2000,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter products in stock only',
    example: true,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Minimum rating filter (0-5)',
    example: 4,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['relevance', 'name', 'price', 'rating', 'createdAt'],
    example: 'relevance',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
    type: ProductResponseDto,
    isArray: true,
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
