# Deployment Guide

## Overview
This guide covers deploying the Node.js + MySQL application to different environments using Docker Compose and preparing for cloud deployment (AWS, Azure, GCP).

## Environment Setup

### Prerequisites
- Docker & Docker Compose installed
- SSH access to deployment server (for remote)
- Domain name (for production)
- SSL certificates (for HTTPS)

### Environment Files

#### Development (.env)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=devops123
DB_NAME=devops_db
LOG_LEVEL=debug
```

#### Production (.env.prod)
```
NODE_ENV=production
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=produser
DB_PASSWORD=<strong-password>
DB_NAME=production_db
LOG_LEVEL=info
```

## Local Development Deployment

### Start Services
```bash
# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Health: http://localhost:3000/api/health

### Stop Services
```bash
docker-compose down

# With volume cleanup
docker-compose down -v
```

## Staging Deployment

### Staging Environment
Mirrors production setup but with less strict resource limits.

### Deploy to Staging
```bash
# Pull latest code
git checkout develop
git pull origin develop

# Set environment
export ENV=staging

# Start services
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Initialize database
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} < init.sql

# Run health checks
curl https://staging.example.com/api/health

# Check logs
docker-compose logs -f app
```

### Verify Deployment
```bash
# API endpoint check
curl -X GET https://staging.example.com/api/users
curl -X POST https://staging.example.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# Database check
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e \
  "SELECT COUNT(*) FROM devops_db.users;"

# Performance check
ab -n 100 -c 10 https://staging.example.com/api/health
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Coverage ≥ 80%
- [ ] Security scans passed
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Backup created
- [ ] Monitoring configured

### Deployment Steps

#### 1. Prepare Server
```bash
# Connect to production server
ssh ubuntu@prod-server.example.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone Repository
```bash
# Create deployment directory
sudo mkdir -p /opt/app
cd /opt/app

# Clone repo
sudo git clone https://github.com/username/devoperation.git .

# Set permissions
sudo chown -R ubuntu:ubuntu /opt/app
```

#### 3. Configure Environment
```bash
# Copy production env file
cp .env.example .env.prod

# Edit with production values
nano .env.prod

# Set file permissions (secure)
chmod 600 .env.prod

# Link to default .env
ln -sf .env.prod .env
```

#### 4. Initialize Database
```bash
# Create persistent volume
docker volume create mysql_prod_data

# Start MySQL first
docker-compose -f docker-compose.prod.yml up -d mysql

# Wait for MySQL to be ready
sleep 30

# Run initialization script
docker-compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} < init.sql

# Verify database
docker-compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

#### 5. Start Application
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 6. Verify Deployment
```bash
# Health check
curl https://app.example.com/api/health

# API test
curl https://app.example.com/api/users

# Performance baseline
ab -n 100 -c 10 https://app.example.com/api/health

# Memory usage
docker stats

# Disk usage
df -h /opt/app
```

### Post-Deployment

#### Monitoring Setup
```bash
# Enable container logging
docker logs --follow app

# Set up log rotation
sudo mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
```

#### Backup Configuration
```bash
# Daily backup script
sudo tee /usr/local/bin/backup-db.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
mkdir -p $BACKUP_DIR

docker-compose -f /opt/app/docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} --all-databases > \
  $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-db.sh

# Add cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -
```

#### Set Up SSL/HTTPS
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d app.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Configure Nginx reverse proxy (optional)
sudo tee /etc/nginx/sites-available/app.example.com > /dev/null <<EOF
server {
    listen 80;
    server_name app.example.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/app.example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Updates & Patches

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild container
docker-compose -f docker-compose.prod.yml build

# Restart services
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# Verify
curl https://app.example.com/api/health
```

### Update Dependencies
```bash
# Update npm packages
npm update

# Update Docker base images
docker pull node:18-alpine
docker pull mysql:8.0

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# Test in staging first
# Then deploy to production
```

## Rollback Procedures

### Quick Rollback
```bash
# Get previous image versions
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | \
  grep devoperation

# Stop current
docker-compose -f docker-compose.prod.yml down

# Update image tag in docker-compose.prod.yml
# e.g., change latest to main-sha1234

# Restart
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl https://app.example.com/api/health
```

### Database Rollback
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} < /backups/mysql/backup_20240101_020000.sql

# Verify restoration
docker-compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} -e \
  "SELECT COUNT(*) FROM production_db.users;"
```

## Cloud Deployment

### AWS ECS Deployment
```yaml
# ecs-task-definition.json
{
  "family": "devops-app",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/devops-app:latest",
      "portMappings": [{
        "containerPort": 3000,
        "hostPort": 3000,
        "protocol": "tcp"
      }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "DB_HOST", "value": "rds-instance.aws.com" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/devops-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Kubernetes Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devops-app
  template:
    metadata:
      labels:
        app: devops-app
    spec:
      containers:
      - name: app
        image: ghcr.io/username/devoperation:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "mysql-service"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Monitoring & Maintenance

### Daily Checks
```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Recent logs
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Error count
docker-compose -f docker-compose.prod.yml logs app | grep ERROR | wc -l
```

### Weekly Tasks
- [ ] Review error logs
- [ ] Check backup completion
- [ ] Monitor disk space
- [ ] Update security patches
- [ ] Review performance metrics

### Monthly Tasks
- [ ] Update dependencies
- [ ] Security audit
- [ ] Capacity planning
- [ ] Disaster recovery test
- [ ] Cost optimization review

## Troubleshooting Deployment

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check resource constraints
docker stats

# Increase memory if needed
# Edit docker-compose.prod.yml
```

### Database Connection Failures
```bash
# Verify MySQL is running
docker-compose ps mysql

# Check connection
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ping

# Review network
docker network ls
docker network inspect devops-network
```

### Performance Issues
```bash
# Monitor resources
docker stats --no-stream

# Check slow queries
docker-compose exec mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  -e "SHOW PROCESSLIST;"

# Optimize database
docker-compose exec mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  -e "OPTIMIZE TABLE devops_db.users;"
```

## Security Checklist

- [ ] Firewall configured (only 80, 443 open)
- [ ] SSH key-based auth only
- [ ] Strong database passwords
- [ ] SSL/HTTPS enabled
- [ ] Regular backups tested
- [ ] Log monitoring enabled
- [ ] Regular security updates
- [ ] Network isolation (VPC, Security Groups)
- [ ] Secrets in environment, not code
- [ ] Regular vulnerability scans

---

**Last Updated**: 2024
