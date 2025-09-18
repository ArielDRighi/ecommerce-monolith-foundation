# 🚀 Multi-stage Dockerfile optimizado para producción enterprise
# Etapa 1: Dependencias base
FROM node:24-alpine AS base

# Instalar dependencias del sistema y herramientas de seguridad
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root desde el inicio
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar ownership del directorio
RUN chown -R nestjs:nodejs /app

# Cambiar a usuario no-root
USER nestjs

# Etapa 2: Instalación de dependencias
FROM base AS dependencies

# Copiar solo archivos de dependencias para mejor cache layering
COPY --chown=nestjs:nodejs package*.json ./

# Instalar TODAS las dependencias (incluyendo dev para build)
RUN npm ci --include=dev && \
    npm cache clean --force

# Etapa 3: Build de la aplicación
FROM dependencies AS build

# Copiar código fuente
COPY --chown=nestjs:nodejs . .

# Build de la aplicación con optimizaciones
RUN npm run build && \
    npm prune --production && \
    npm cache clean --force

# Remover archivos innecesarios para reducir tamaño
RUN rm -rf src/ test/ *.md *.json.backup \
    .eslintrc.js .prettierrc tsconfig*.json \
    jest.config.js stryker.conf.mjs

# Etapa 4: Imagen de producción optimizada
FROM base AS production

# Metadatos para trazabilidad
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest

LABEL maintainer="Ariel D. Righi <ariel@example.com>" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="E-commerce Monolith" \
      org.label-schema.description="NestJS E-commerce API" \
      org.label-schema.url="https://github.com/ArielDRighi/ecommerce-monolith-foundation" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/ArielDRighi/ecommerce-monolith-foundation" \
      org.label-schema.vendor="Ariel D. Righi" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

# Variables de entorno para producción
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_PROGRESS=false

# Copiar aplicación construida desde etapa de build
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Crear directorio para logs
RUN mkdir -p logs && chown nestjs:nodejs logs

# Exponer puerto
EXPOSE $PORT

# Health check robusto con timeout y retries
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Usar dumb-init para manejo de señales y zombies
ENTRYPOINT ["dumb-init", "--"]

# Comando optimizado para producción
CMD ["node", "--max-old-space-size=512", "dist/main"]

# Etapa 5: Imagen de desarrollo (target: development)
FROM dependencies AS development

# Variables de entorno para desarrollo
ENV NODE_ENV=development

# Copiar código fuente completo
COPY --chown=nestjs:nodejs . .

# Exponer puerto y puerto de debug
EXPOSE 3000 9229

# Health check simplificado para desarrollo
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=2 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando para desarrollo con hot reload
CMD ["npm", "run", "start:dev"]

# Etapa 6: Imagen para testing (target: test)
FROM dependencies AS test

# Variables de entorno para testing
ENV NODE_ENV=test

# Copiar código fuente completo
COPY --chown=nestjs:nodejs . .

# Health check deshabilitado para tests
HEALTHCHECK NONE

# Comando para ejecutar tests
CMD ["npm", "run", "test"]