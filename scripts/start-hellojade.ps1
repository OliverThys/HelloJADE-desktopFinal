# HelloJADE Startup Script for Windows
# Version: 2.0.0

param(
    [switch]$Dev,
    [switch]$Build,
    [switch]$Clean,
    [string]$Environment = "development"
)

Write-Host "🚀 HelloJADE Startup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Clean up if requested
if ($Clean) {
    Write-Host "🧹 Cleaning up containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v --remove-orphans
    docker system prune -f
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Build images if requested
if ($Build) {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    docker-compose build --no-cache
    Write-Host "✅ Build completed" -ForegroundColor Green
}

# Set environment variables
$env:COMPOSE_PROJECT_NAME = "hellojade"
$env:NODE_ENV = $Environment

# Start services
Write-Host "🚀 Starting HelloJADE services..." -ForegroundColor Yellow

if ($Dev) {
    Write-Host "📱 Starting in development mode..." -ForegroundColor Cyan
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
} else {
    Write-Host "🏭 Starting in production mode..." -ForegroundColor Cyan
    docker-compose up -d
}

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow

$services = @("postgres", "redis", "asterisk", "backend", "frontend")
$maxWait = 300 # 5 minutes
$waitTime = 0

foreach ($service in $services) {
    Write-Host "🔍 Checking $service..." -ForegroundColor Cyan
    $ready = $false
    
    while (-not $ready -and $waitTime -lt $maxWait) {
        try {
            $status = docker-compose ps $service --format "{{.State}}"
            if ($status -eq "running") {
                $ready = $true
                Write-Host "✅ $service is ready" -ForegroundColor Green
            } else {
                Start-Sleep -Seconds 5
                $waitTime += 5
            }
        } catch {
            Start-Sleep -Seconds 5
            $waitTime += 5
        }
    }
    
    if (-not $ready) {
        Write-Host "❌ $service failed to start within $maxWait seconds" -ForegroundColor Red
        Write-Host "📋 Checking logs for $service..." -ForegroundColor Yellow
        docker-compose logs $service
        exit 1
    }
}

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow

# Check PostgreSQL
try {
    $pgStatus = docker-compose exec -T postgres pg_isready -U hellojade
    if ($pgStatus -match "accepting connections") {
        Write-Host "✅ PostgreSQL is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL is not healthy" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check PostgreSQL health" -ForegroundColor Red
}

# Check Redis
try {
    $redisStatus = docker-compose exec -T redis redis-cli ping
    if ($redisStatus -eq "PONG") {
        Write-Host "✅ Redis is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis is not healthy" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check Redis health" -ForegroundColor Red
}

# Check Backend API
try {
    $backendStatus = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 10
    if ($backendStatus.status -eq "healthy") {
        Write-Host "✅ Backend API is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend API is not healthy" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check Backend API health" -ForegroundColor Red
}

# Display service URLs
Write-Host "`n🌐 Service URLs:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "Frontend (Tauri): http://localhost:1420" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
Write-Host "Asterisk AMI: localhost:5038" -ForegroundColor Cyan
Write-Host "Asterisk ARI: http://localhost:8088" -ForegroundColor Cyan

# Display useful commands
Write-Host "`n🛠️  Useful Commands:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "View logs: docker-compose logs -f [service]" -ForegroundColor Yellow
Write-Host "Stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "Restart service: docker-compose restart [service]" -ForegroundColor Yellow
Write-Host "Access database: docker-compose exec postgres psql -U hellojade -d hellojade" -ForegroundColor Yellow
Write-Host "Access Redis: docker-compose exec redis redis-cli" -ForegroundColor Yellow

# Open browser if in development mode
if ($Dev) {
    Write-Host "`n🌐 Opening browser..." -ForegroundColor Green
    Start-Process "http://localhost:1420"
}

Write-Host "`n🎉 HelloJADE is ready!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
