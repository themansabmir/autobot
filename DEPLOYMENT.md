# Deployment Guide

## Overview

This project uses separate Docker Compose configurations for local development and production deployment:

- **`docker-compose.yml`**: Local development (builds images from source)
- **`docker-compose.prod.yml`**: Production deployment (pulls pre-built images from GHCR)

## Workflow

### 1. Local Development

```bash
# Start local development environment
docker compose up

# This will build images from your local Dockerfile
```

### 2. Push to Dev Branch

```bash
git add .
git commit -m "your changes"
git push origin dev
```

This triggers the GitHub Actions workflow which:
- Builds 3 Docker images:
  - `ghcr.io/themansabmir/autobot-builder:latest`
  - `ghcr.io/themansabmir/autobot-viewer:latest`
  - `ghcr.io/themansabmir/autobot-campaign-worker:latest`
- Pushes them to GitHub Container Registry (GHCR)

### 3. Deploy to VPS (Production)

On your VPS server:

```bash
# Pull latest code
git pull origin dev

# Login to GitHub Container Registry (one-time setup)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest images and start services
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

**Important**: The production compose file will **NOT rebuild** - it pulls pre-built images from GHCR, so startup is fast.

### 4. Test on VPS

Test your application thoroughly on the VPS using the dev branch deployment.

### 5. Merge to Main (Production)

Once testing is complete:

```bash
git checkout main
git merge dev
git push origin main
```

## GitHub Token Setup

To pull private images from GHCR on your VPS:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `read:packages` scope
3. On your VPS, login once:
   ```bash
   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

## Environment Variables

Make sure your `.env` file exists on the VPS with all required variables before running docker compose.

## Useful Commands

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (CAUTION: deletes data)
docker compose -f docker-compose.prod.yml down -v

# Update to latest images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f typebot-builder

# Restart specific service
docker compose -f docker-compose.prod.yml restart typebot-viewer
```

## Architecture

### Services

- **typebot-builder**: Admin interface (port 8080)
- **typebot-viewer**: Public bot viewer (port 8081)
- **typebot-scheduler**: Campaign scheduler
- **typebot-campaign-worker**: Campaign execution
- **typebot-whatsapp-worker**: WhatsApp message handling (3 replicas)
- **typebot-completion-checker**: Campaign completion monitoring
- **typebot-db**: PostgreSQL database
- **typebot-redis**: Redis cache
- **typebot-rabbitmq**: Message queue
- **typebot-minio**: S3-compatible object storage

### Ports

- `8080`: Builder UI
- `8081`: Viewer UI
- `5672`: RabbitMQ
- `15672`: RabbitMQ Management UI
- `9000`: MinIO API
- `9001`: MinIO Console

## Troubleshooting

### Images not pulling

Make sure you're logged into GHCR:
```bash
docker login ghcr.io
```

### Services failing to start

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs
```

### Database connection issues

Ensure DATABASE_URL in `.env` matches the service name:
```
DATABASE_URL=postgresql://postgres:typebot@typebot-db:5432/typebot
```
