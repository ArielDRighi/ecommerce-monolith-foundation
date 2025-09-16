# GitFlow Workflow

Este proyecto sigue GitFlow para demostrar gestión profesional de código.

## Estructura de Ramas

```
master (main)     ←  Releases en producción
  ↑
develop          ←  Rama de integración principal
  ↑
feature/*        ←  Nuevas funcionalidades
hotfix/*         ←  Fixes críticos
release/*        ←  Preparación de releases
```

## Flujo de Trabajo

### 1. Nuevas Funcionalidades

```bash
# Desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-feature

# Desarrollo...
git add .
git commit -m "feat: descripción del feature"

# Al finalizar
git checkout develop
git merge feature/nombre-feature
git branch -d feature/nombre-feature
```

### 2. Hotfixes

```bash
# Desde master
git checkout master
git checkout -b hotfix/nombre-fix

# Fix...
git add .
git commit -m "fix: descripción del fix"

# Merge a master y develop
git checkout master
git merge hotfix/nombre-fix
git checkout develop
git merge hotfix/nombre-fix
```

### 3. Releases

```bash
# Desde develop
git checkout develop
git checkout -b release/v1.0.0

# Preparación release...
git add .
git commit -m "chore: prepare release v1.0.0"

# Merge a master
git checkout master
git merge release/v1.0.0
git tag v1.0.0

# Merge back to develop
git checkout develop
git merge release/v1.0.0
```

## Conventional Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato, espacios, etc.
- `refactor:` Refactorización de código
- `test:` Tests
- `chore:` Tareas de mantenimiento

## Estado Actual

- **master**: Commit inicial con fundaciones
- **develop**: Lista para integración
- **feature/auth-module**: 🚧 En desarrollo (JWT + Guards + DTOs)
