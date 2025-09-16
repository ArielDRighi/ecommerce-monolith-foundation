import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface LoggerConfig {
  level: string;
  logDir: string;
  maxFiles: string;
  maxSize: string;
  datePattern: string;
  environment: string;
}

export const createWinstonLogger = (configService: ConfigService) => {
  const loggerConfig: LoggerConfig = {
    level: configService.get<string>('LOG_LEVEL', 'info'),
    logDir: configService.get<string>('LOG_DIR', './logs'),
    maxFiles: configService.get<string>('LOG_MAX_FILES', '14d'),
    maxSize: configService.get<string>('LOG_MAX_SIZE', '20m'),
    datePattern: configService.get<string>('LOG_DATE_PATTERN', 'YYYY-MM-DD'),
    environment: configService.get<string>('NODE_ENV', 'development'),
  };

  // Ensure log directory exists
  const logDirPath = join(process.cwd(), loggerConfig.logDir);
  if (!existsSync(logDirPath)) {
    try {
      mkdirSync(logDirPath, { recursive: true });
    } catch (error) {
      console.warn('Could not create log directory:', error);
    }
  }

  // Custom format for structured logging
  const structuredFormat = format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    format.errors({ stack: true }),
    format.json(),
  );

  // Console format for development
  const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({
      format: 'HH:mm:ss.SSS',
    }),
    format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
      const metaStr = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : '';
      const corrId = correlationId ? `[${correlationId as string}] ` : '';
      return `${String(timestamp)} ${String(level)}: ${corrId}${String(
        message,
      )} ${metaStr}`;
    }),
  );

  // Start with console transport only
  const loggerTransports: any[] = [
    new transports.Console({
      format:
        loggerConfig.environment === 'production'
          ? structuredFormat
          : consoleFormat,
      level: loggerConfig.level,
    }),
  ];

  // Add file transports if directory exists and is writable
  if (existsSync(logDirPath)) {
    try {
      loggerTransports.push(
        new DailyRotateFile({
          filename: join(logDirPath, 'app-%DATE%.log'),
          datePattern: loggerConfig.datePattern,
          maxFiles: loggerConfig.maxFiles,
          maxSize: loggerConfig.maxSize,
          format: structuredFormat,
          level: loggerConfig.level,
        }),
        new DailyRotateFile({
          filename: join(logDirPath, 'error-%DATE%.log'),
          datePattern: loggerConfig.datePattern,
          maxFiles: loggerConfig.maxFiles,
          maxSize: loggerConfig.maxSize,
          format: structuredFormat,
          level: 'error',
        }),
      );
    } catch (error) {
      console.warn('Could not create file transports:', error);
    }
  }

  return createLogger({
    level: loggerConfig.level,
    format: structuredFormat,
    defaultMeta: {
      service: 'ecommerce-monolith',
      environment: loggerConfig.environment,
    },
    transports: loggerTransports,
    exitOnError: false,
  });
};

// Log levels priority
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;
