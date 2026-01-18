#!/bin/bash

# Error handling
set -euo pipefail
trap 'error_handler $? $LINENO' ERR

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Error handler function
error_handler() {
    local exit_code=$1
    local line_number=$2
    echo ""
    echo -e "${RED}❌ Error occurred at line $line_number with exit code $exit_code${NC}"
    echo -e "${RED}Setup failed. Please check the error above.${NC}"
    echo ""
    exit $exit_code
}

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

# Detect if running on AWS EC2 and get public IP
HOST_IP="localhost"
AWS_IP=""

# Check for manual IP override first (for AWS if metadata doesn't work)
if [ -n "${PUBLIC_IP:-}" ]; then
    HOST_IP="$PUBLIC_IP"
    echo -e "${BLUE}🌐 Using manually set public IP: $HOST_IP${NC}"
    echo ""
# Try to get AWS public IP from metadata service
elif AWS_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null) && [ -n "$AWS_IP" ] && [[ "$AWS_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    HOST_IP="$AWS_IP"
    echo -e "${BLUE}🌐 Detected AWS EC2 instance. Using public IP: $HOST_IP${NC}"
    echo ""
elif [ -n "${EC2_PUBLIC_IP:-}" ]; then
    HOST_IP="$EC2_PUBLIC_IP"
    echo -e "${BLUE}🌐 Using EC2 public IP from environment: $HOST_IP${NC}"
    echo ""
else
    # Try to get public IP from other methods
    # Check if we can get it from hostname or external service
    if command -v hostname &> /dev/null; then
        HOSTNAME_IP=$(hostname -I 2>/dev/null | awk '{print $1}' | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' | head -1)
        if [ -n "$HOSTNAME_IP" ] && [[ ! "$HOSTNAME_IP" =~ ^127\. ]]; then
            HOST_IP="$HOSTNAME_IP"
            echo -e "${BLUE}🌐 Using host IP: $HOST_IP${NC}"
            echo ""
        fi
    fi
fi

# Step 1: Create Docker network
time_step "Step 1: Docker Network"
echo -e "${YELLOW}📦 Creating Docker network...${NC}"
if ! docker network create pharmacy-network 2>/dev/null; then
    if docker network inspect pharmacy-network &>/dev/null; then
        echo -e "${GREEN}✅ Network already exists${NC}"
    else
        echo -e "${RED}❌ Failed to create Docker network${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Network created${NC}"
fi
end_step "Step 1: Docker Network"

# Step 2: Backend Setup
time_step "Step 2: Backend Environment"
echo -e "${YELLOW}📦 Setting up Backend...${NC}"
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi
cd "$BACKEND_DIR" || {
    echo -e "${RED}❌ Failed to change to backend directory${NC}"
    exit 1
}

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
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi
cd "$FRONTEND_DIR" || {
    echo -e "${RED}❌ Failed to change to frontend directory${NC}"
    exit 1
}

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
if [ ! -d "$DOCKER_DIR" ]; then
    echo -e "${RED}❌ Docker directory not found: $DOCKER_DIR${NC}"
    exit 1
fi
cd "$DOCKER_DIR" || {
    echo -e "${RED}❌ Failed to change to Docker directory${NC}"
    exit 1
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

# Stop and remove existing containers if any
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true

# Build and start all services
echo "🏗️  Building Docker images..."
if ! docker-compose build; then
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

echo "🚀 Starting containers..."
if ! docker-compose up -d; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    echo -e "${YELLOW}💡 Trying to clean up...${NC}"
    docker-compose down 2>/dev/null || true
    exit 1
fi

# Wait for database
echo "⏳ Waiting for database to be ready..."
DB_READY=false
for i in {1..60}; do
    if docker-compose exec -T backend-db mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        DB_READY=true
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}⚠️  Database not ready after 60 seconds${NC}"
        echo -e "${YELLOW}💡 Checking container status...${NC}"
        docker-compose ps backend-db
    fi
    sleep 1
done

if [ "$DB_READY" = false ]; then
    echo -e "${YELLOW}⚠️  Continuing anyway, but database may not be ready${NC}"
fi

# Generate app key if needed
if [ "$KEY_NEEDED" = true ]; then
    echo "🔑 Generating app key..."
    if ! docker-compose exec -T backend-app php artisan key:generate --force 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Failed to generate app key, but continuing...${NC}"
    else
        echo -e "${GREEN}✅ App key generated${NC}"
    fi
fi

# Run migrations
echo "📊 Running migrations..."
if ! docker-compose exec -T backend-app php artisan migrate --force 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Migrations may have failed or already run${NC}"
    echo -e "${YELLOW}💡 Check logs: docker-compose logs backend-app${NC}"
else
    echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# Run seeders
echo "🌱 Running seeders..."
if ! docker-compose exec -T backend-app php artisan db:seed --force 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Seeders may have failed or already run${NC}"
else
    echo -e "${GREEN}✅ Seeders completed${NC}"
fi
end_step "Step 4: Docker Containers"

# Step 5: Health Check
time_step "Step 5: Health Check"
echo -e "${YELLOW}🔍 Checking services...${NC}"
sleep 5

# Check backend
echo "🔍 Checking backend..."
BACKEND_RETRIES=0
BACKEND_READY=false
while [ $BACKEND_RETRIES -lt 10 ]; do
    if curl -s --max-time 5 http://localhost:8000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running: http://$HOST_IP:8000${NC}"
        BACKEND_READY=true
        break
    fi
    BACKEND_RETRIES=$((BACKEND_RETRIES + 1))
    sleep 2
done

if [ "$BACKEND_READY" = false ]; then
    echo -e "${YELLOW}⚠️  Backend not responding after 20 seconds${NC}"
    echo -e "${YELLOW}💡 Check logs: cd Docker && docker-compose logs backend-app${NC}"
fi

# Check frontend
echo "🔍 Checking frontend..."
FRONTEND_RETRIES=0
FRONTEND_READY=false
while [ $FRONTEND_RETRIES -lt 10 ]; do
    if curl -s --max-time 5 http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running: http://$HOST_IP:3001${NC}"
        FRONTEND_READY=true
        break
    fi
    FRONTEND_RETRIES=$((FRONTEND_RETRIES + 1))
    sleep 2
done

if [ "$FRONTEND_READY" = false ]; then
    echo -e "${YELLOW}⚠️  Frontend not responding after 20 seconds${NC}"
    echo -e "${YELLOW}💡 Check logs: cd Docker && docker-compose logs frontend${NC}"
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
echo "   Backend:  http://$HOST_IP:8000"
echo "   Frontend: http://$HOST_IP:3001"
echo "   API:      http://$HOST_IP:8000/api"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "   Stop all:     cd Docker && docker-compose down"
echo "   Start all:    cd Docker && docker-compose up -d"
echo "   View logs:    cd Docker && docker-compose logs -f"
echo "   Restart:      cd Docker && docker-compose restart"
echo ""
