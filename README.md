# Ecommerce Monolith Foundation

<p align="center">
  <a href="https://github.com/ArielDRighi/ecommerce-monolith-foundation/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/ArielDRighi/ecommerce-monolith-foundation/ci-cd-pipeline.yml?branch=main&style=for-the-badge" alt="CI/CD Status"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/tests-482%20unit%20%2B%2089%20e2e-brightgreen?style=for-the-badge" alt="Test Coverage"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/coverage-95%25-brightgreen?style=for-the-badge" alt="Code Coverage"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/performance-87%25%20improved-blue?style=for-the-badge" alt="Performance"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/database-29%20indexes-orange?style=for-the-badge" alt="Database Optimization"/>
  </a>
</p>

<p align="center">
  Un backend monolítico de nivel empresarial construido con NestJS, diseñado para demostrar excelencia técnica, optimización de base de datos y prácticas de DevOps profesionales.
</p>

<p align="center">
  <a href="#-acerca-del-proyecto">Acerca del Proyecto</a> •
  <a href="#-stack-tecnológico">Stack Tecnológico</a> •
  <a href="#-iniciando">Iniciando</a> •
  <a href="#-uso">Uso</a> •
  <a href="#-testing">Testing</a> •
  <a href="#-despliegue">Despliegue</a> •
  <a href="#-documentación-del-proyecto">Documentación</a> •
  <a href="#-decisiones-de-arquitectura">Arquitectura</a> •
  <a href="#-contacto">Contacto</a>
</p>

---

## 📖 Acerca del Proyecto

Este proyecto es una base de monolito para e-commerce, robusta y lista para un entorno empresarial. Construido con **NestJS**, **TypeScript**, **PostgreSQL** y **TypeORM**, sirve como una demostración de las mejores prácticas en el desarrollo de backend. Incluye una arquitectura modular, una estrategia de testing exhaustiva, un sistema de logging profesional y un pipeline de CI/CD completamente automatizado.

El objetivo principal es demostrar la capacidad de construir sistemas de backend de alta calidad, escalables y mantenibles, aplicando principios rigurosos de gestión de proyectos en la toma de decisiones técnicas.

**🎯 Documentación Completa:** El proyecto incluye documentación técnica profesional que demuestra planificación previa, incluyendo diseño de base de datos, product backlog con metodología ágil, ADRs (Architecture Decision Records), y templates de GitHub para gestión de issues.

---

### 🏛️ Decisiones de Arquitectura y Diseño

Este proyecto no es solo código; es el resultado de un proceso de ingeniería deliberado y documentado. Todas las decisiones arquitectónicas clave, desde la elección del monolito hasta la estrategia de testing, están registradas como **Architecture Decision Records (ADRs)**.

Este enfoque demuestra un compromiso con la planificación estratégica, la gestión de riesgos y la comunicación técnica clara, aplicando más de 10 años de experiencia en gestión de proyectos al desarrollo de software.

➡️ **[Explora aquí los ADRs para entender el "porqué" detrás de cada decisión técnica.](https://github.com/ArielDRighi/ecommerce-monolith-foundation/tree/develop/docs/adr)**

---

### ✨ Características Principales

- **Autenticación y Autorización Avanzada:** Registro de usuarios y login seguros con JWT (Access y Refresh tokens), sistema de blacklist de tokens para logout seguro, control de acceso basado en roles (Admin vs. Cliente) y protección de rutas mediante Guards.
- **Gestión Completa de Productos y Categorías:** Operaciones CRUD completas para productos y categorías con validación avanzada, disponibles exclusivamente para administradores.
- **Catálogo Público Optimizado:** Endpoints públicos para buscar y listar productos con filtrado avanzado, paginación, ordenamiento y búsqueda full-text de alto rendimiento.
- **Sistema de Analytics en Tiempo Real:** Dashboard de analytics con métricas de performance, contadores de productos, usuarios y categorías.
- **Optimización de Base de Datos Empresarial:** 29 índices estratégicos de base de datos, nomenclatura snake_case optimizada, y consultas de alto rendimiento incluso con grandes volúmenes de datos.
- **Logging Profesional Estructurado:** Sistema de logging de extremo a extremo con IDs de correlación, interceptors de request/response, y filtros de excepción globales para facilitar el seguimiento y debugging.
- **Sistema de Testing Exhaustivo:** 482 pruebas unitarias, 89 pruebas E2E, cobertura >95%, y testing de mutación para garantizar calidad de código.
- **Contenerización y DevOps:** Aplicación completamente contenerizada con Docker multi-stage builds, docker-compose para múltiples entornos (dev, test, prod).
- **Pipeline CI/CD Empresarial:** Pipeline automatizado con GitHub Actions, quality gates, escaneo de seguridad, y despliegue multi-ambiente.
- **Documentación API Completa:** Documentación Swagger/OpenAPI con ejemplos reales de base de datos y esquemas detallados.

---

## 🛠️ Stack Tecnológico

Este proyecto está construido con un stack tecnológico moderno y de nivel empresarial:

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/-NestJS-ea2845?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/-TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://img.shields.io/badge/-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  </a>
  <a href="https://typeorm.io/" target="_blank">
    <img src="https://img.shields.io/badge/-TypeORM-E83524?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM"/>
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://img.shields.io/badge/-Docker-2496ed?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  </a>
  <a href="https://jestjs.io/" target="_blank">
    <img src="https://img.shields.io/badge/-Jest-c21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
  </a>
  <a href="https://swagger.io/" target="_blank">
    <img src="https://img.shields.io/badge/-Swagger-85ea2d?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger"/>
  </a>
  <a href="https://github.com/features/actions" target="_blank">
    <img src="https://img.shields.io/badge/-GitHub%20Actions-2088ff?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions"/>
  </a>
</p>

---

## 🚀 Iniciando

Para obtener una copia local y ponerla en marcha, sigue estos sencillos pasos.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/) (v18 o superior)
- [Docker](https://www.docker.com/get-started) y Docker Compose
- [Git](https://git-scm.com/)

### Instalación

1.  **Clona el repositorio:**
    ```sh
    git clone https://github.com/ArielDRighi/ecommerce-monolith-foundation.git
    cd ecommerce-monolith-foundation
    ```
2.  **Configura tus variables de entorno:**
    Copia el archivo de ejemplo y ajústalo según tus necesidades.

    ```sh
    cp .env.example .env
    ```

    _Actualiza el archivo `.env` con tus credenciales de base de datos y otras configuraciones._

3.  **Instala las dependencias:**
    ```sh
    npm install
    ```
4.  **Inicia el entorno de desarrollo:**

    ```sh
    docker-compose up -d
    ```

    Este comando levantará PostgreSQL, Redis y todos los servicios necesarios.

5.  **Ejecuta las migraciones y seeds:**

    ```sh
    npm run migration:run
    npm run seed
    ```

6.  **Inicia la aplicación:**
    ```sh
    npm run start:dev
    ```

---

## 💻 Uso

Una vez iniciado, el servidor estará disponible en `http://localhost:3000`.

### Credenciales de Acceso

Para probar la API, utiliza estas credenciales pre-cargadas:

**Usuario Administrador:**

- Email: `admin@ecommerce.local`
- Password: `admin123`

**Usuario Cliente:**

- Email: `customer@ecommerce.local`
- Password: `customer123`

### Documentación de la API

La documentación de la API se genera automáticamente con **Swagger** y está disponible en:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Endpoints Principales

#### Autenticación

- `POST /auth/register`: Registra un nuevo usuario
- `POST /auth/login`: Inicia sesión y recibe tokens JWT
- `POST /auth/logout`: Cierre de sesión seguro con blacklist de tokens
- `GET /auth/profile`: Obtiene el perfil del usuario autenticado

#### Productos (Público)

- `GET /products`: Lista todos los productos con paginación
- `GET /products/search`: Búsqueda avanzada con filtros
- `GET /products/popular`: Productos más populares
- `GET /products/recent`: Productos recién agregados
- `GET /products/:id`: Obtiene un producto específico
- `GET /products/slug/:slug`: Obtiene producto por slug

#### Gestión de Productos (Admin)

- `POST /products`: Crea un nuevo producto (solo Admin)
- `PATCH /products/:id`: Actualiza un producto (solo Admin)
- `DELETE /products/:id`: Elimina un producto (solo Admin)

#### Categorías

- `GET /products/categories`: Lista todas las categorías (público)
- `GET /products/categories/:id`: Obtiene categoría específica (público)
- `POST /products/categories`: Crea nueva categoría (solo Admin)
- `PATCH /products/categories/:id`: Actualiza categoría (solo Admin)
- `DELETE /products/categories/:id`: Elimina categoría (solo Admin)

#### Analytics

- `GET /analytics/dashboard`: Dashboard con métricas del sistema

Para ver la lista completa de endpoints y probarlos, visita la documentación de Swagger.

---

## ✅ Testing

El proyecto cuenta con una suite de pruebas empresarial con **>95% de cobertura de código** y **482 pruebas unitarias + 89 pruebas E2E**.

| Comando                     | Descripción                                              |
| :-------------------------- | :------------------------------------------------------- |
| `npm test`                  | Ejecuta todas las 482 pruebas unitarias y de integración |
| `npm run test:e2e`          | Ejecuta las 89 pruebas End-to-End completas              |
| `npm run test:cov`          | Genera reporte de cobertura de código (>95%)             |
| `npm run test:mutation`     | Ejecuta pruebas de mutación para medir calidad de tests  |
| `npm run test:e2e:api`      | Pruebas E2E específicas de API                           |
| `npm run test:e2e:business` | Pruebas E2E de flujos de negocio                         |

### Métricas de Testing

- **482 pruebas unitarias** ✅ (100% passing)
- **89 pruebas E2E** ✅ (100% passing)
- **>95% cobertura de código** ✅
- **Tiempo de ejecución**: <10 segundos (unit), <90 segundos (E2E)

---

## � Optimización y Performance

### Métricas de Performance Logradas

- **Búsqueda de productos**: 89ms (87% mejora)
- **Productos populares**: 21ms (95% mejora)
- **Búsqueda full-text**: 156ms (92% mejora)
- **Consultas con paginación**: <50ms constante

### Optimizaciones Implementadas

- **29 índices estratégicos** en PostgreSQL
- **Nomenclatura snake_case** optimizada
- **Query builders** optimizados con TypeORM
- **Paginación eficiente** en todos los endpoints
- **Conexion pooling** configurado para producción

---

## �📦 Despliegue

El proyecto está configurado para un despliegue sencillo en un entorno de producción utilizando Docker.

Para construir y ejecutar el contenedor de producción:

```sh
docker-compose -f docker-compose.prod.yml up -d
```

### Comandos de Despliegue Disponibles

| Comando                    | Descripción                             |
| :------------------------- | :-------------------------------------- |
| `npm run build`            | Construye la aplicación para producción |
| `npm run start:prod`       | Inicia la aplicación en modo producción |
| `npm run migration:run`    | Ejecuta migraciones de base de datos    |
| `npm run migration:revert` | Revierte la última migración            |
| `npm run seed`             | Ejecuta seeds para datos iniciales      |

---

## 🔄 CI/CD

Este proyecto utiliza **GitHub Actions** para la integración y el despliegue continuo. El pipeline está definido en `.github/workflows/ci-cd-pipeline.yml` e incluye las siguientes fases:

1.  **Quality Gates:** Linting, formatting, y análisis de código estático
2.  **Testing Comprehensive:** 482 pruebas unitarias + 89 pruebas E2E
3.  **Security Scanning:** npm audit y análisis de vulnerabilidades
4.  **Code Coverage:** Verificación de >90% cobertura de código
5.  **Build Validation:** Construcción y validación de Docker images
6.  **Multi-Environment Deploy:** Despliegue automático a staging y producción

### CI/CD Metrics

- **Quality Gates**: 6 validaciones automáticas
- **Test Execution Time**: <2 minutos
- **Build Time**: <5 minutos
- **Deploy Time**: <3 minutos

---

## 📚 Documentación del Proyecto

Este proyecto incluye documentación técnica completa y profesional que demuestra planificación previa y procesos de desarrollo estructurados:

### 🗄️ Documentación de Base de Datos

- **[DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)** - Diseño completo de base de datos con ERD, estrategia de indexing y benchmarks de performance
- **[DATABASE_SCHEMA_DIAGRAM.md](./docs/DATABASE_SCHEMA_DIAGRAM.md)** - Diagrama visual del schema con relaciones y métricas de optimización
- **[ADR-009: Database Design Architecture](./docs/adr/009-database-design-architecture.md)** - Decisiones de arquitectura de base de datos con alternativas consideradas

### 📋 Gestión de Proyecto

- **[PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md)** - Product backlog profesional con 10 epics, 147 story points y metodología ágil
- **[PROJECT_SETUP.md](./docs/PROJECT_SETUP.md)** - Guía detallada del setup inicial del proyecto con comandos y configuraciones

### 🎯 Guías de Desarrollo

- **[ACCEPTANCE_CRITERIA_GUIDE.md](./docs/ACCEPTANCE_CRITERIA_GUIDE.md)** - Mejores prácticas para criterios de aceptación y Definition of Done

### 🎫 Templates de GitHub

- **[Issue Templates](./.github/ISSUE_TEMPLATE/)** - Templates profesionales para:
  - 🐛 Bug Reports
  - ✨ Feature Requests
  - 📋 Epics
  - 🧪 Testing Tasks
  - 🚀 DevOps Tasks

### 🏛️ Architecture Decision Records (ADRs)

Directorio completo: **[docs/adr/](./docs/adr/)**

| ADR                                                         | Título                                  | Estado      | Fecha      |
| ----------------------------------------------------------- | --------------------------------------- | ----------- | ---------- |
| [ADR-001](./docs/adr/001-monolithic-architecture.md)        | Arquitectura Monolítica                 | ✅ Aceptado | 2025-09-18 |
| [ADR-002](./docs/adr/002-technology-stack-selection.md)     | Selección del Stack Tecnológico         | ✅ Aceptado | 2025-09-18 |
| [ADR-003](./docs/adr/003-database-optimization-strategy.md) | Optimización de Base de Datos           | ✅ Aceptado | 2025-09-18 |
| [ADR-004](./docs/adr/004-authentication-architecture.md)    | Arquitectura de Autenticación           | ✅ Aceptado | 2025-09-18 |
| [ADR-005](./docs/adr/005-testing-strategy.md)               | Estrategia de Testing                   | ✅ Aceptado | 2025-09-18 |
| [ADR-006](./docs/adr/006-containerization-strategy.md)      | Estrategia de Containerización          | ✅ Aceptado | 2025-09-18 |
| [ADR-007](./docs/adr/007-ci-cd-pipeline-architecture.md)    | Arquitectura de CI/CD Pipeline          | ✅ Aceptado | 2025-09-18 |
| [ADR-008](./docs/adr/008-logging-monitoring-strategy.md)    | Estrategia de Logging y Monitoring      | ✅ Aceptado | 2025-09-18 |
| [ADR-009](./docs/adr/009-database-design-architecture.md)   | Diseño de Arquitectura de Base de Datos | ✅ Aceptado | 2025-09-18 |

---

## 🏛️ Decisiones de Arquitectura

La arquitectura de este proyecto se basa en **Architectural Decision Records (ADRs)** profesionales y documentación técnica completa. Todas las decisiones están documentadas con contexto, alternativas consideradas y consecuencias.

### 🎯 Decisiones Clave Implementadas

- **Arquitectura Monolítica Modular** para optimización del rendimiento y simplicidad operacional
- **Stack Tecnológico Empresarial** (NestJS + TypeScript + PostgreSQL + TypeORM) para robustez y escalabilidad
- **Optimización de Base de Datos** con índices estratégicos y nomenclatura optimizada
- **Autenticación JWT Avanzada** con blacklist de tokens para logout seguro
- **Testing Exhaustivo** con >95% cobertura y mutation testing
- **CI/CD Automatizado** con quality gates y security scanning
- **Logging Estructurado** con correlation IDs para observabilidad empresarial

### 📋 Principios de Arquitectura Aplicados

- **Separation of Concerns**: Módulos claramente separados (Auth, Products, Analytics, Logging)
- **SOLID Principles**: Aplicados en toda la codebase
- **Clean Architecture**: Capas bien definidas con inversión de dependencias
- **Enterprise Patterns**: Repository pattern, DTO pattern, Guard pattern

---

## 📞 Contacto

**Ariel D'Righi** - arieldavidrighi@gmail.com

**Enlace del Proyecto:** [https://github.com/ArielDRighi/ecommerce-monolith-foundation](https://github.com/ArielDRighi/ecommerce-monolith-foundation)
