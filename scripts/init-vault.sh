#!/bin/bash
# Initialize Vault with development secrets
# This script should only be run in development!

set -e

VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
VAULT_TOKEN="${VAULT_TOKEN:-pribec-dev-token}"

echo "=== PRIBEC Vault Initialization ==="
echo "Vault Address: $VAULT_ADDR"

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
until curl -s "$VAULT_ADDR/v1/sys/health" > /dev/null 2>&1; do
    sleep 1
done
echo "Vault is ready!"

# Enable KV secrets engine v2 if not already enabled
echo "Configuring secrets engine..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{"type": "kv", "options": {"version": "2"}}' \
    "$VAULT_ADDR/v1/sys/mounts/secret" 2>/dev/null || true

# Store database credentials
echo "Storing database credentials..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "username": "pribec",
            "password": "pribec_dev_password",
            "host": "localhost",
            "port": "5432",
            "database": "pribec_dev"
        }
    }' \
    "$VAULT_ADDR/v1/secret/data/pribec/database"

# Store JWT secret
echo "Storing JWT secret..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "secret": "dev-jwt-secret-change-in-production-32chars",
            "expiry": "15m",
            "refresh_expiry": "7d"
        }
    }' \
    "$VAULT_ADDR/v1/secret/data/pribec/jwt"

# Store encryption key
echo "Storing encryption key..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "key": "dev-encryption-key-32-characters!"
        }
    }' \
    "$VAULT_ADDR/v1/secret/data/pribec/encryption"

# Store S3/MinIO credentials
echo "Storing storage credentials..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "endpoint": "http://localhost:9000",
            "access_key": "pribec_access_key",
            "secret_key": "pribec_secret_key",
            "bucket": "pribec-docs"
        }
    }' \
    "$VAULT_ADDR/v1/secret/data/pribec/storage"

# Store RabbitMQ credentials
echo "Storing message broker credentials..."
curl -s -X POST \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "host": "localhost",
            "port": "5672",
            "username": "pribec",
            "password": "pribec_dev_password"
        }
    }' \
    "$VAULT_ADDR/v1/secret/data/pribec/rabbitmq"

# Create API policy
echo "Creating API policy..."
curl -s -X PUT \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "policy": "path \"secret/data/pribec/*\" { capabilities = [\"read\"] }"
    }' \
    "$VAULT_ADDR/v1/sys/policies/acl/pribec-api"

echo ""
echo "=== Vault Initialization Complete ==="
echo ""
echo "Development Token: $VAULT_TOKEN"
echo "Vault UI: $VAULT_ADDR/ui"
echo ""
echo "Stored secrets:"
echo "  - pribec/database"
echo "  - pribec/jwt"
echo "  - pribec/encryption"
echo "  - pribec/storage"
echo "  - pribec/rabbitmq"
echo ""
echo "Note: These are development secrets only!"
echo "Never use these values in production."
