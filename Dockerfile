# Dockerfile Multi-stage para producción optimizada
FROM node:18-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache dumb-init

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar ownership del directorio
RUN chown -R nestjs:nodejs /app

# Cambiar a usuario no-root
USER nestjs

# Copiar archivos desde builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Usar dumb-init para manejo de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "dist/main"]