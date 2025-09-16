import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_DIR,
  DEFAULT_LOG_MAX_FILES,
  DEFAULT_LOG_MAX_SIZE,
  DEFAULT_LOG_DATE_PATTERN,
  DEFAULT_ENVIRONMENT,
  SERVICE_NAME,
} from '../constants';

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
    level: configService.get<string>('LOG_LEVEL', DEFAULT_LOG_LEVEL),
    logDir: configService.get<string>('LOG_DIR', DEFAULT_LOG_DIR),
    maxFiles: configService.get<string>('LOG_MAX_FILES', DEFAULT_LOG_MAX_FILES),
    maxSize: configService.get<string>('LOG_MAX_SIZE', DEFAULT_LOG_MAX_SIZE),
    datePattern: configService.get<string>(
      'LOG_DATE_PATTERN',
      DEFAULT_LOG_DATE_PATTERN,
    ),
    environment: configService.get<string>('NODE_ENV', DEFAULT_ENVIRONMENT),
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
      service: configService.get<string>('SERVICE_NAME', SERVICE_NAME),
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
