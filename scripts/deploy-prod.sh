#!/bin/bash
# 🏭 Production Deployment Script

set -e

echo "🏭 Starting Production Deployment..."

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_NAME=${IMAGE_NAME:-"ecommerce-monolith"}
VERSION=${VERSION:-$(git rev-parse --short HEAD)}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { 
        log "❌ Docker is required but not installed."
        exit 1
    }
    
    command -v docker-compose >/dev/null 2>&1 || { 
        log "❌ Docker Compose is required but not installed."
        exit 1
    }
    
    if [ ! -f .env.production ]; then
        log "❌ .env.production file is required for production deployment."
        exit 1
    fi
    
    log "✅ Prerequisites check passed!"
}

build_image() {
    log "🏗️ Building production Docker image..."
    
    docker build \
        --target production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$(git rev-parse --short HEAD) \
        --build-arg VERSION=${VERSION} \
        -t ${IMAGE_NAME}:${VERSION} \
        -t ${IMAGE_NAME}:latest \
        .
    
    log "✅ Docker image built successfully!"
}

run_tests() {
    log "🧪 Running tests before deployment..."
    
    # Run tests in test environment
    docker-compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from app-test
    
    local test_exit_code=$?
    docker-compose -f docker-compose.test.yml down --remove-orphans
    
    if [ $test_exit_code -ne 0 ]; then
        log "❌ Tests failed! Deployment aborted."
        exit 1
    fi
    
    log "✅ All tests passed!"
}

push_image() {
    if [ -n "$DOCKER_REGISTRY" ] && [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        log "📤 Pushing image to registry..."
        
        docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}
        docker tag ${IMAGE_NAME}:latest ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
        
        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}
        docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
        
        log "✅ Image pushed to registry!"
    else
        log "⚠️ Skipping image push (no registry configured)"
    fi
}

deploy_production() {
    log "🚀 Deploying to production..."
    
    # Stop current production containers
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images (if using registry)
    if [ -n "$DOCKER_REGISTRY" ] && [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
        docker-compose -f docker-compose.prod.yml pull
    fi
    
    # Start production environment
    docker-compose -f docker-compose.prod.yml up -d
    
    log "⏳ Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log "✅ Production deployment successful!"
        log "🎉 Application is running at http://localhost:3000"
    else
        log "❌ Health check failed! Rolling back..."
        docker-compose -f docker-compose.prod.yml logs app
        docker-compose -f docker-compose.prod.yml down
        exit 1
    fi
}

rollback() {
    log "🔄 Rolling back deployment..."
    docker-compose -f docker-compose.prod.yml down
    # Additional rollback logic here
    log "✅ Rollback completed"
}

# Main execution
case "${1:-deploy}" in
    "check")
        check_prerequisites
        ;;
    "build")
        check_prerequisites
        build_image
        ;;
    "test")
        check_prerequisites
        run_tests
        ;;
    "push")
        check_prerequisites
        build_image
        push_image
        ;;
    "deploy")
        check_prerequisites
        build_image
        run_tests
        push_image
        deploy_production
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 {check|build|test|push|deploy|rollback}"
        echo ""
        echo "Commands:"
        echo "  check    - Check prerequisites"
        echo "  build    - Build Docker image"
        echo "  test     - Run tests"
        echo "  push     - Push image to registry"
        echo "  deploy   - Full deployment (build + test + push + deploy)"
        echo "  rollback - Rollback deployment"
        exit 1
        ;;
esac