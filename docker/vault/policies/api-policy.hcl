# PRIBEC API Policy
# Grants access to API secrets

# Database credentials
path "secret/data/pribec/database" {
  capabilities = ["read"]
}

# JWT secrets
path "secret/data/pribec/jwt" {
  capabilities = ["read"]
}

# Encryption keys
path "secret/data/pribec/encryption" {
  capabilities = ["read"]
}

# External API keys
path "secret/data/pribec/external/*" {
  capabilities = ["read"]
}

# S3/Storage credentials
path "secret/data/pribec/storage" {
  capabilities = ["read"]
}

# Message broker credentials
path "secret/data/pribec/rabbitmq" {
  capabilities = ["read"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
