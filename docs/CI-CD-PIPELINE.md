# 🚀 CI/CD Pipeline Documentation

## 📋 Overview

Este proyecto implementa un pipeline CI/CD enterprise-grade con múltiples stages de calidad, seguridad y deployment automático.

## 🏗️ Pipeline Architecture

### 📊 Quality Gates

- **ESLint Check**: Verificación de código style y best practices
- **TypeScript Check**: Compilación sin errores en modo strict
- **Prettier Format Check**: Formato consistente de código

### 🧪 Testing Strategy

- **Unit Tests**: Cobertura >90% obligatoria
- **Integration Tests**: Tests con base de datos real
- **E2E Tests**: Pruebas de flujos completos de negocio
- **Performance Tests**: Validación de performance con datasets grandes

### 🔒 Security Scanning

- **NPM Audit**: Vulnerabilidades de dependencias
- **CodeQL Analysis**: Análisis estático de seguridad
- **Trivy Scanner**: Vulnerabilidades en imágenes Docker
- **License Compliance**: Verificación de licencias permitidas

### 🐳 Container Strategy

- **Multi-stage Builds**: Optimización de imágenes
- **Security Scanning**: Trivy integration
- **Layer Caching**: GitHub Actions cache
- **Health Checks**: Validación de deployment

## 📋 Workflow Triggers

### Automatic Triggers

- **Push to main/develop**: Full pipeline execution
- **Pull Requests**: Quality gates + tests
- **Schedule**: Weekly security scans (Mondays 09:00 UTC)
- **Dependency Updates**: Dependabot integration

### Manual Triggers

- **workflow_dispatch**: Manual pipeline execution
- **Deploy to staging**: Automatic on develop
- **Deploy to production**: Manual approval required

## 🎯 Quality Requirements

### Mandatory Gates

- ✅ **Linting**: Zero errors
- ✅ **TypeScript**: Strict mode compilation
- ✅ **Tests**: 100% pass rate
- ✅ **Coverage**: >90% required
- ✅ **Security**: No critical/high vulnerabilities

### Performance Benchmarks

- 🚀 **API Response Time**: <200ms average
- 📊 **Database Queries**: <50ms average
- 🔄 **Memory Usage**: <512MB container limit
- ⚡ **CPU Usage**: <50% average load

## 🌍 Environment Strategy

### Development Environment

```bash
# Start development environment
npm run docker:dev

# Available at:
# - Application: http://localhost:3000
# - API Docs: http://localhost:3000/api/docs
# - pgAdmin: http://localhost:8080
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001
```

### Testing Environment

```bash
# Run complete test suite
npm run docker:test

# Individual test types
npm run test:utils unit
npm run test:utils integration
npm run test:utils e2e
npm run test:utils performance
```

### Production Environment

```bash
# Deploy to production
npm run deploy:prod

# Manual deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Local Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd ecommerce-monolith-foundation

# Setup development environment
npm run dev:setup

# Start coding!
npm run start:dev
```

## 🚀 Deployment Process

### Staging Deployment (Automatic)

1. Code pushed to `develop` branch
2. Pipeline executes all quality gates
3. If all checks pass, deploys to staging
4. Notification sent to team

### Production Deployment (Manual Approval)

1. Code pushed to `main` branch
2. Pipeline executes all quality gates
3. Manual approval required in GitHub
4. Blue-green deployment with health checks
5. Automatic rollback on failure

## 📊 Monitoring & Observability

### Health Checks

- **Application**: `/health` endpoint
- **Database**: PostgreSQL health check
- **Redis**: Connection validation
- **Container**: Docker health checks

### Metrics Collection

- **Prometheus**: Application metrics
- **Grafana**: Visual dashboards
- **Logs**: Structured logging with Winston
- **APM**: Request tracing and performance

### Alerting

- **Failed Deployments**: Immediate notification
- **Test Failures**: PR comments and email
- **Security Issues**: Slack/email alerts
- **Performance Degradation**: Threshold alerts

## 🔒 Security Practices

### Code Security

- **Static Analysis**: CodeQL integration
- **Dependency Scanning**: Daily vulnerability checks
- **License Compliance**: Approved licenses only
- **Secrets Management**: Environment variables only

### Container Security

- **Base Images**: Alpine Linux (minimal attack surface)
- **Non-root User**: Containers run as unprivileged user
- **Read-only Filesystem**: Immutable container layers
- **Security Scanning**: Trivy integration

### Network Security

- **Private Networks**: Container isolation
- **SSL/TLS**: HTTPS only in production
- **CORS**: Strict origin policies
- **Rate Limiting**: DDoS protection

## 📈 Performance Optimization

### Build Optimization

- **Multi-stage Builds**: Smaller production images
- **Layer Caching**: Faster build times
- **Dependency Caching**: NPM cache reuse
- **Parallel Jobs**: Concurrent pipeline execution

### Runtime Optimization

- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Fast container startup
- **Database Indexing**: Optimized queries
- **Caching Strategy**: Redis integration

## 🛠️ Maintenance

### Regular Tasks

- **Dependency Updates**: Weekly (Dependabot)
- **Security Scans**: Weekly automated
- **Performance Reviews**: Monthly
- **Documentation Updates**: With each feature

### Incident Response

1. **Alert Detection**: Automated monitoring
2. **Issue Triage**: Severity assessment
3. **Rollback**: Automatic on critical failures
4. **Investigation**: Root cause analysis
5. **Prevention**: Process improvements

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

## 🎯 Success Metrics

### Quality Metrics

- **Test Coverage**: >90% maintained
- **Bug Escape Rate**: <5% to production
- **Code Review Coverage**: 100%
- **Security Vulnerabilities**: Zero critical/high

### Performance Metrics

- **Deployment Frequency**: Daily to staging
- **Lead Time**: <24h from commit to production
- **MTTR**: <1h for critical issues
- **Change Failure Rate**: <10%
