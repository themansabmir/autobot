#!/bin/bash

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ..."
while ! nc -z typebot-rabbitmq 5672; do
  sleep 1
done
echo "RabbitMQ is ready!"

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z typebot-db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run Prisma migrations
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy --schema=packages/prisma/postgresql/schema.prisma

# Run the campaign worker
echo "Starting Campaign Worker Service..."
cd packages/campaign-worker
exec bun run src/main.ts
