# Ecommerce Monolith Foundation

<p align="center">
  <a href="https://github.com/ArielDRighi/ecommerce-monolith-foundation/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/ArielDRighi/ecommerce-monolith-foundation/ci-cd-pipeline.yml?branch=main&style=for-the-badge" alt="CI/CD Status"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/coverage-95%25-brightgreen?style=for-the-badge" alt="Code Coverage"/>
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/license-UNLICENSED-red?style=for-the-badge" alt="License"/>
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
  <a href="#-decisiones-de-arquitectura">Arquitectura</a> •
  <a href="#-contacto">Contacto</a>
</p>

---

## 📖 Acerca del Proyecto

Este proyecto es una base de monolito para e-commerce, robusta y lista para un entorno empresarial. Construido con **NestJS**, **TypeScript**, **PostgreSQL** y **TypeORM**, sirve como una demostración de las mejores prácticas en el desarrollo de backend. Incluye una arquitectura modular, una estrategia de testing exhaustiva, un sistema de logging profesional y un pipeline de CI/CD completamente automatizado.

El objetivo principal es demostrar la capacidad de construir sistemas de backend de alta calidad, escalables y mantenibles, aplicando principios rigurosos de gestión de proyectos en la toma de decisiones técnicas.

### ✨ Características Principales

- **Autenticación y Autorización:** Registro de usuarios y login seguros con JWT (Access y Refresh tokens), control de acceso basado en roles (Admin vs. Cliente) y protección de rutas mediante Guards.
- **Gestión de Productos:** Operaciones CRUD (Crear, Leer, Actualizar, Borrar) completas para productos, disponibles exclusivamente para administradores.
- **Catálogo Público de Productos:** Un endpoint público para buscar y listar productos con filtrado, paginación y ordenamiento eficientes.
- **Optimización de Base de Datos:** Uso estratégico de índices de base de datos para garantizar consultas de alto rendimiento, incluso con grandes volúmenes de datos.
- **Logging Profesional:** Sistema de logging estructurado de extremo a extremo, con IDs de correlación para facilitar el seguimiento y la depuración de solicitudes.
- **Contenerización:** Aplicación completamente contenerizada con Docker y Docker Compose para los entornos de desarrollo, testing y producción.
- **Pipeline CI/CD:** Pipeline de CI/CD automatizado con GitHub Actions, que incluye linting, pruebas, escaneo de seguridad y barreras de calidad (quality gates).
- **Documentación de API:** Documentación de API autogenerada con Swagger/OpenAPI.

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
    npm run docker:dev
    ```
    Este comando levantará la aplicación y la base de datos PostgreSQL en contenedores de Docker.

---

## 💻 Uso

Una vez iniciado, el servidor estará disponible en `http://localhost:3000`.

### Documentación de la API

La documentación de la API se genera automáticamente con **Swagger** y está disponible en:
**[http://localhost:3000/api](http://localhost:3000/api)**

### Endpoints Principales

- `POST /auth/register`: Registra un nuevo usuario.
- `POST /auth/login`: Inicia sesión y recibe tokens JWT.
- `GET /products/search`: Busca y lista productos (público).
- `POST /products`: Crea un nuevo producto (solo Admin).

Para ver la lista completa de endpoints y probarlos, visita la documentación de Swagger.

---

## ✅ Testing

El proyecto cuenta con una suite de pruebas completa con más del **95% de cobertura de código**.

| Comando                 | Descripción                                                     |
| :---------------------- | :-------------------------------------------------------------- |
| `npm test`              | Ejecuta todas las pruebas unitarias y de integración.           |
| `npm run test:e2e`      | Ejecuta las pruebas End-to-End.                                 |
| `npm run test:cov`      | Genera un reporte de cobertura de código.                       |
| `npm run test:mutation` | Ejecuta pruebas de mutación para medir la calidad de los tests. |

---

## 📦 Despliegue

El proyecto está configurado para un despliegue sencillo en un entorno de producción utilizando Docker.

Para construir y ejecutar el contenedor de producción, utiliza el siguiente comando:

```sh
npm run docker:prod
```

---

## 🔄 CI/CD

Este proyecto utiliza **GitHub Actions** para la integración y el despliegue continuo. El pipeline está definido en `.github/workflows/ci-cd-pipeline.yml` e incluye las siguientes fases:

1.  **Linting y Calidad de Código:** Asegura un estilo de código consistente.
2.  **Pruebas Unitarias y de Integración:** Verifica la funcionalidad principal.
3.  **Pruebas End-to-End:** Valida la aplicación de principio a fin.
4.  **Escaneo de Seguridad:** Busca vulnerabilidades en el código y las dependencias.
5.  **Construcción (Build):** Crea la imagen de Docker optimizada para producción.
6.  **Despliegue:** Despliega la aplicación en un entorno de staging o producción.

---

## 🏛️ Decisiones de Arquitectura

La arquitectura de este proyecto se basa en una serie de **Architectural Decision Records (ADRs)** bien documentados, que se pueden encontrar en el directorio `docs/adr`.

Las decisiones clave incluyen:

- **ADR-001: Arquitectura Monolítica:** Se optó por una arquitectura monolítica modular para centrarse en la lógica de negocio principal y la optimización del rendimiento.
- **ADR-002: Selección del Stack Tecnológico:** Se seleccionó NestJS, TypeScript, PostgreSQL y TypeORM como el stack principal por su robustez, rendimiento y preparación para entornos empresariales.

---

## 📞 Contacto

**Ariel D'Righi** - arieldavidrighi@gmail.com

**Enlace del Proyecto:** [https://github.com/ArielDRighi/ecommerce-monolith-foundation](https://github.com/ArielDRighi/ecommerce-monolith-foundation)
