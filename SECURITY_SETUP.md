# Security Setup Guide

## 🔐 Required Actions Before Production Deployment

### 1. Generate Strong Passwords

All passwords must be changed from the placeholder values in `.env.example`. Use one of these methods:

```bash
# Generate a strong 32-character password
openssl rand -base64 32

# Or generate multiple passwords at once
for i in {1..5}; do openssl rand -base64 32; done
```

### 2. Create Your `.env` File

```bash
cp .env.example .env
```

Then edit `.env` and replace ALL instances of `CHANGE_ME_TO_STRONG_PASSWORD_MIN_32_CHARS` with unique, strong passwords.

**Required environment variables:**
- `POSTGRES_PASSWORD` - PostgreSQL database password
- `REDIS_PASSWORD` - Redis cache password
- `RABBITMQ_PASSWORD` - RabbitMQ message queue password
- `MINIO_ROOT_PASSWORD` - MinIO S3 storage password

### 3. Security Improvements Applied

✅ **Credentials Externalized**: All hardcoded passwords moved to environment variables with validation
✅ **Management Interfaces Secured**: RabbitMQ and MinIO admin panels bound to localhost only
✅ **Resource Limits**: CPU and memory limits added to prevent resource exhaustion
✅ **Security Hardening**: `no-new-privileges` flag added to all containers
✅ **Redis Persistence**: Changed from RDB to AOF for better data durability
✅ **Password Protection**: Redis now requires authentication
✅ **Reduced Public Access**: MinIO bucket changed from full public to download-only for `/public` path
✅ **Health Checks**: Added health checks for application services
✅ **Retry Logic**: Replaced fixed sleep with proper retry logic in bucket creation

### 4. Accessing Management Interfaces

Management interfaces are now bound to `127.0.0.1` (localhost only) for security:

- **RabbitMQ Management**: http://localhost:15672
- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000

To access from remote machines, use SSH tunneling:

```bash
ssh -L 15672:localhost:15672 -L 9001:localhost:9001 user@your-server
```

### 5. Additional Production Recommendations

#### Add Reverse Proxy with SSL/TLS
Use Nginx or Traefik to:
- Terminate SSL/TLS
- Add rate limiting
- Implement WAF protection
- Manage domain routing

#### Implement Backup Strategy
```bash
# Example: Backup PostgreSQL
docker exec typebot-db pg_dump -U typebot typebot > backup_$(date +%Y%m%d).sql

# Example: Backup MinIO data
docker run --rm -v typebot_s3-data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup_$(date +%Y%m%d).tar.gz /data
```

#### Add Monitoring
Consider adding:
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Alertmanager for notifications

#### Network Segmentation (Future Enhancement)
Consider separating services into multiple networks:
- Frontend network (builder, viewer)
- Backend network (workers, scheduler)
- Data network (db, redis, rabbitmq, minio)

#### Use Specific Image Tags
Replace `:latest` tags with specific version tags for reproducible deployments:
```yaml
image: ghcr.io/themansabmir/autobot-builder:v1.2.3
```

### 6. Verification Checklist

Before going live, verify:

- [ ] All passwords in `.env` are strong and unique (min 32 characters)
- [ ] `.env` file has proper permissions (`chmod 600 .env`)
- [ ] Management interfaces are not publicly accessible
- [ ] SSL/TLS certificates are configured on reverse proxy
- [ ] Backup strategy is implemented and tested
- [ ] Monitoring and alerting are configured
- [ ] Resource limits are appropriate for your workload
- [ ] Health checks are passing for all services

### 7. Starting the Stack

```bash
# Validate the configuration
docker compose -f docker-compose.prod.yml config

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check service health
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 8. Security Maintenance

- Regularly update Docker images
- Rotate passwords periodically
- Monitor logs for suspicious activity
- Keep backups in secure, off-site locations
- Review and update resource limits based on usage patterns
