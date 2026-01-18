#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timing variables
start_time=$(date +%s)
step_start_time=0

# Timing functions
time_step() {
    local step_name="$1"
    step_start_time=$(date +%s)
    echo -e "${YELLOW}⏱️  Starting: $step_name${NC}"
}

end_step() {
    local step_name="$1"
    local step_end_time=$(date +%s)
    local step_duration=$((step_end_time - step_start_time))
    local minutes=$((step_duration / 60))
    local seconds=$((step_duration % 60))
    if [ $minutes -gt 0 ]; then
        echo -e "${GREEN}✅ $step_name completed in ${minutes}m ${seconds}s${NC}"
    else
        echo -e "${GREEN}✅ $step_name completed in ${seconds}s${NC}"
    fi
    echo ""
}

echo -e "${BLUE}🚀 Setting up Local Environment (AWS Production Mirror)${NC}"
echo "=========================================="
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DOCKER_DIR="$PROJECT_ROOT/Docker"

# Step 1: Create Docker network
time_step "Step 1: Docker Network"
echo -e "${YELLOW}📦 Creating Docker network...${NC}"
docker network create pharmacy-network 2>/dev/null && echo -e "${GREEN}✅ Network created${NC}" || echo -e "${GREEN}✅ Network already exists${NC}"
end_step "Step 1: Docker Network"

# Step 2: Backend Setup
time_step "Step 2: Backend Environment"
echo -e "${YELLOW}📦 Setting up Backend...${NC}"
cd "$BACKEND_DIR"

# Copy .env.local to .env if not exists
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        cp .env.local .env
        echo -e "${GREEN}✅ .env file created from .env.local${NC}"
    elif [ -f .env.local.example ]; then
        cp .env.local.example .env
        echo -e "${GREEN}✅ .env file created from .env.local.example${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.local not found, creating default .env${NC}"
        cat > .env << 'EOF'
APP_NAME="Pharmacy Management System"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=backend-db
DB_PORT=3306
DB_DATABASE=pharmacy_db
DB_USERNAME=pharmacy_user
DB_PASSWORD=root
EOF
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "🔑 Generating app key..."
    KEY_NEEDED=true
else
    KEY_NEEDED=false
    echo -e "${GREEN}✅ App key already exists${NC}"
fi
end_step "Step 2: Backend Environment"

# Step 3: Frontend Setup - Skip host build (Docker handles it)
time_step "Step 3: Frontend Setup"
echo -e "${YELLOW}📦 Setting up Frontend...${NC}"
cd "$FRONTEND_DIR"

# Copy .env.local to .env if not exists
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        cp .env.local .env
        echo -e "${GREEN}✅ .env file created from .env.local${NC}"
    elif [ -f .env.local.example ]; then
        cp .env.local.example .env
        echo -e "${GREEN}✅ .env file created from .env.local.example${NC}"
    else
        echo "VITE_API_URL=http://localhost:8000/api" > .env
        echo -e "${GREEN}✅ Default .env created${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Skip npm build - Docker will handle it
if command -v npm &> /dev/null; then
    echo "📦 Installing frontend dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ Dependencies already installed${NC}"
    fi
    
    echo "🏗️  Building frontend..."
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend build complete${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend build failed, but continuing (Docker will build)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npm not found, skipping host build (Docker will build frontend)${NC}"
fi

end_step "Step 3: Frontend Setup"

# Step 4: Build and Start All Containers
time_step "Step 4: Docker Containers"
echo -e "${YELLOW}🐳 Building and starting all containers...${NC}"
cd "$DOCKER_DIR"

# Stop and remove existing containers if any
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true

# Build and start all services
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

# Wait for database
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T backend-db mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  Database may not be ready, continuing anyway...${NC}"
    fi
    sleep 1
done

# Generate app key if needed
if [ "$KEY_NEEDED" = true ]; then
    echo "🔑 Generating app key..."
    docker-compose exec -T backend-app php artisan key:generate --force 2>/dev/null || true
fi

# Run migrations
echo "📊 Running migrations..."
docker-compose exec -T backend-app php artisan migrate --force 2>/dev/null || echo -e "${YELLOW}⚠️  Migrations may have failed or already run${NC}"

# Run seeders
echo "🌱 Running seeders..."
docker-compose exec -T backend-app php artisan db:seed --force 2>/dev/null || echo -e "${YELLOW}⚠️  Seeders may have failed or already run${NC}"
end_step "Step 4: Docker Containers"

# Step 5: Health Check
time_step "Step 5: Health Check"
echo -e "${YELLOW}🔍 Checking services...${NC}"
sleep 5

# Check backend
if curl -s --max-time 5 http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running: http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may need a moment to start${NC}"
fi

# Check frontend
if curl -s --max-time 5 http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running: http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may need a moment to start${NC}"
fi
end_step "Step 5: Health Check"

# Calculate total time
end_time=$(date +%s)
total_duration=$((end_time - start_time))
total_minutes=$((total_duration / 60))
total_seconds=$((total_duration % 60))

echo ""
echo -e "${GREEN}🎉 Local setup complete!${NC}"
echo ""
if [ $total_minutes -gt 0 ]; then
    echo -e "${BLUE}⏱️  Total Setup Time: ${total_minutes}m ${total_seconds}s${NC}"
else
    echo -e "${BLUE}⏱️  Total Setup Time: ${total_seconds}s${NC}"
fi
echo ""
echo -e "${BLUE}📋 Access your application:${NC}"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3001"
echo "   API:      http://localhost:8000/api"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "   Stop all:     cd Docker && docker-compose down"
echo "   Start all:    cd Docker && docker-compose up -d"
echo "   View logs:    cd Docker && docker-compose logs -f"
echo "   Restart:      cd Docker && docker-compose restart"
echo ""
