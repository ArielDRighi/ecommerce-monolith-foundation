import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get API welcome message',
    description: 'Returns a welcome message indicating the API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message returned successfully',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  @ApiProduces('text/plain')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'System health check',
    description:
      'Returns detailed system health information including status, uptime, environment, and version',
  })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: 'Overall system status',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-09-18T14:30:00.000Z',
          description: 'Current server timestamp',
        },
        uptime: {
          type: 'number',
          example: 86400.5,
          description: 'Server uptime in seconds',
        },
        environment: {
          type: 'string',
          example: 'production',
          enum: ['development', 'staging', 'production'],
          description: 'Current environment',
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: 'Application version',
        },
      },
      required: ['status', 'timestamp', 'uptime', 'environment', 'version'],
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service temporarily unavailable',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'error',
        },
        message: {
          type: 'string',
          example: 'Service temporarily unavailable',
        },
      },
    },
  })
  getHealthCheck() {
    return this.appService.getHealthCheck();
  }
}
