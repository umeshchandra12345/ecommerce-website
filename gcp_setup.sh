#!/bin/bash
# Exit on any error
set -e

echo "========================================="
# 1. Update OS package indices
echo "Updating package repositories..."
sudo apt-get update -y

# 2. Install Git and Docker utilities
echo "Installing Git, Docker, and utilities..."
sudo apt-get install -y git docker.io docker-compose curl

# 3. Enable and start Docker service
echo "Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# 4. Clone repository if not already present
if [ ! -d "ecommerce-website" ]; then
    echo "Cloning repository..."
    git clone https://github.com/umeshchandra12345/ecommerce-website.git
fi

cd ecommerce-website

# 5. Build .env file dynamically
echo "Creating production .env configuration..."
cat << 'EOF' > .env
# Database Settings (Points to Supabase on production to save GCE memory)
DATABASE_URL=postgresql+psycopg://postgres.vgsvwfxerquhjptmexxc:Umesh%405566.@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
POSTGRES_SERVER=aws-0-ap-southeast-2.pooler.supabase.com
POSTGRES_PORT=6543
POSTGRES_USER=postgres.vgsvwfxerquhjptmexxc
POSTGRES_PASSWORD=Umesh@5566.
POSTGRES_DB=postgres

# Redis Settings (Using local redis container within docker-compose)
REDIS_HOST=redis
REDIS_PORT=6379

# Security Settings
JWT_SECRET=very-strong-secret-key-that-is-at-least-32-bytes-long
JWT_ALGORITHM=HS256

# Mail Service
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_mail_password
MAIL_FROM=your_email@gmail.com
MAIL_FROM_NAME=FastShip
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587

# Twilio Credentials
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_NUMBER=+10000000000
EOF

echo ".env created successfully!"

# 6. Run Docker Compose
echo "Stopping any existing container stack..."
sudo docker-compose down || true

echo "Starting Docker Compose services (API, Redis, Celery)..."
# We don't need local Postgres container since we point directly to Supabase production database
# This saves precious RAM on the e2-micro (1GB memory limit)
sudo docker-compose up -d --build api redis celery

echo "========================================="
echo "🎉 DEPLOYMENT STARTED SUCCESSFULLY!"
echo "FastAPI API container is running on port 8000."
echo "========================================="
