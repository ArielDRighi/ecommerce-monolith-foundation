#!/bin/bash
# 🧪 Testing Utilities Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test database setup
setup_test_db() {
    log "🗄️ Setting up test database..."
    
    # Start test database
    docker-compose -f docker-compose.test.yml up -d postgres-test redis-test
    
    # Wait for database
    log "⏳ Waiting for test database to be ready..."
    sleep 10
    
    # Run migrations
    log "🔄 Running test migrations..."
    NODE_ENV=test npm run migration:run
    
    # Seed test data
    log "🌱 Seeding test database..."
    NODE_ENV=test npm run seed
    
    success "Test database setup complete!"
}

# Clean test environment
cleanup_test_env() {
    log "🧹 Cleaning up test environment..."
    docker-compose -f docker-compose.test.yml down --remove-orphans
    docker volume prune -f
    success "Test environment cleaned up!"
}

# Run unit tests
run_unit_tests() {
    log "🧪 Running unit tests..."
    npm run test:cov
    
    # Check coverage threshold
    COVERAGE=$(npm run test:cov:text | grep "All files" | awk '{print $10}' | sed 's/%//')
    if [ "${COVERAGE:-0}" -lt 90 ]; then
        error "Coverage $COVERAGE% is below 90% threshold!"
        return 1
    fi
    
    success "Unit tests passed with $COVERAGE% coverage!"
}

# Run integration tests
run_integration_tests() {
    log "🔗 Running integration tests..."
    setup_test_db
    
    NODE_ENV=test npm run test:e2e:integration
    
    cleanup_test_env
    success "Integration tests passed!"
}

# Run E2E tests
run_e2e_tests() {
    log "🎯 Running E2E tests..."
    setup_test_db
    
    NODE_ENV=test npm run test:e2e:business
    
    cleanup_test_env
    success "E2E tests passed!"
}

# Run all tests
run_all_tests() {
    log "🚀 Running complete test suite..."
    
    run_unit_tests
    run_integration_tests
    run_e2e_tests
    
    success "All tests passed! 🎉"
}

# Performance tests
run_performance_tests() {
    log "⚡ Running performance tests..."
    setup_test_db
    
    NODE_ENV=test npm run test:e2e:performance
    
    cleanup_test_env
    success "Performance tests completed!"
}

# Security tests
run_security_tests() {
    log "🔒 Running security tests..."
    
    # NPM audit
    log "🔍 Running npm audit..."
    npm audit --audit-level=high
    
    # Security linting
    log "🔍 Running security linting..."
    npx eslint . --ext .ts --config .eslintrc.security.js || warning "Security linting issues found"
    
    success "Security tests completed!"
}

# Mutation testing
run_mutation_tests() {
    log "🧬 Running mutation tests..."
    
    case "${2:-quick}" in
        "full")
            npm run test:mutation
            ;;
        "auth")
            npm run test:mutation:auth
            ;;
        "products")
            npm run test:mutation:products
            ;;
        *)
            npm run test:mutation:quick
            ;;
    esac
    
    success "Mutation testing completed!"
}

# Test reports
generate_test_reports() {
    log "📊 Generating test reports..."
    
    # Coverage report
    npm run test:cov:html
    
    # Copy reports to public folder
    mkdir -p public/reports
    cp -r coverage/* public/reports/
    
    success "Test reports generated in public/reports/"
}

# Watch mode for development
run_test_watch() {
    log "👀 Running tests in watch mode..."
    npm run test:watch
}

# Help function
show_help() {
    echo "🧪 E-commerce Monolith Test Utilities"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  unit                 - Run unit tests with coverage"
    echo "  integration          - Run integration tests"
    echo "  e2e                  - Run E2E tests"
    echo "  all                  - Run all test suites"
    echo "  performance          - Run performance tests"
    echo "  security             - Run security tests"
    echo "  mutation [type]      - Run mutation tests (full|auth|products|quick)"
    echo "  reports              - Generate test reports"
    echo "  watch                - Run tests in watch mode"
    echo "  setup-db             - Setup test database only"
    echo "  cleanup              - Cleanup test environment"
    echo "  help                 - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 all                    # Run complete test suite"
    echo "  $0 mutation auth          # Run mutation tests for auth module"
    echo "  $0 unit                   # Run unit tests only"
}

# Main execution
case "${1:-help}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "all")
        run_all_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "security")
        run_security_tests
        ;;
    "mutation")
        run_mutation_tests "$@"
        ;;
    "reports")
        generate_test_reports
        ;;
    "watch")
        run_test_watch
        ;;
    "setup-db")
        setup_test_db
        ;;
    "cleanup")
        cleanup_test_env
        ;;
    "help"|*)
        show_help
        ;;
esac