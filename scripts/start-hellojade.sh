#!/bin/bash

# HelloJADE Startup Script for Linux/macOS
# Version: 2.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DEV=false
BUILD=false
CLEAN=false
ENVIRONMENT="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            DEV=true
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dev      Start in development mode"
            echo "  --build    Build Docker images"
            echo "  --clean    Clean up containers and volumes"
            echo "  --env      Set environment (default: development)"
            echo "  -h, --help Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🚀 HelloJADE Startup Script${NC}"
echo -e "${GREEN}================================${NC}"

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if Docker Compose is available
if ! docker-compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Clean up if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning up containers and volumes...${NC}"
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

# Build images if requested
if [ "$BUILD" = true ]; then
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Build completed${NC}"
fi

# Set environment variables
export COMPOSE_PROJECT_NAME="hellojade"
export NODE_ENV="$ENVIRONMENT"

# Start services
echo -e "${YELLOW}🚀 Starting HelloJADE services...${NC}"

if [ "$DEV" = true ]; then
    echo -e "${CYAN}📱 Starting in development mode...${NC}"
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
else
    echo -e "${CYAN}🏭 Starting in production mode...${NC}"
    docker-compose up -d
fi

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"

services=("postgres" "redis" "asterisk" "backend" "frontend")
max_wait=300 # 5 minutes
wait_time=0

for service in "${services[@]}"; do
    echo -e "${CYAN}🔍 Checking $service...${NC}"
    ready=false
    
    while [ "$ready" = false ] && [ $wait_time -lt $max_wait ]; do
        if docker-compose ps "$service" --format "{{.State}}" | grep -q "running"; then
            ready=true
            echo -e "${GREEN}✅ $service is ready${NC}"
        else
            sleep 5
            wait_time=$((wait_time + 5))
        fi
    done
    
    if [ "$ready" = false ]; then
        echo -e "${RED}❌ $service failed to start within $max_wait seconds${NC}"
        echo -e "${YELLOW}📋 Checking logs for $service...${NC}"
        docker-compose logs "$service"
        exit 1
    fi
done

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U hellojade | grep -q "accepting connections"; then
    echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not healthy${NC}"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${RED}❌ Redis is not healthy${NC}"
fi

# Check Backend API
if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API is not healthy${NC}"
fi

# Display service URLs
echo -e "\n${GREEN}🌐 Service URLs:${NC}"
echo -e "${GREEN}=================${NC}"
echo -e "${CYAN}Frontend (Tauri): http://localhost:1420${NC}"
echo -e "${CYAN}Backend API: http://localhost:3000${NC}"
echo -e "${CYAN}PostgreSQL: localhost:5432${NC}"
echo -e "${CYAN}Redis: localhost:6379${NC}"
echo -e "${CYAN}Asterisk AMI: localhost:5038${NC}"
echo -e "${CYAN}Asterisk ARI: http://localhost:8088${NC}"

# Display useful commands
echo -e "\n${GREEN}🛠️  Useful Commands:${NC}"
echo -e "${GREEN}===================${NC}"
echo -e "${YELLOW}View logs: docker-compose logs -f [service]${NC}"
echo -e "${YELLOW}Stop services: docker-compose down${NC}"
echo -e "${YELLOW}Restart service: docker-compose restart [service]${NC}"
echo -e "${YELLOW}Access database: docker-compose exec postgres psql -U hellojade -d hellojade${NC}"
echo -e "${YELLOW}Access Redis: docker-compose exec redis redis-cli${NC}"

# Open browser if in development mode
if [ "$DEV" = true ]; then
    echo -e "\n${GREEN}🌐 Opening browser...${NC}"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:1420
    elif command -v open >/dev/null 2>&1; then
        open http://localhost:1420
    fi
fi

echo -e "\n${GREEN}🎉 HelloJADE is ready!${NC}"
echo -e "${GREEN}================================${NC}"
