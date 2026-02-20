# PRIBEC Vault Configuration
# Development mode configuration

ui = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true  # Only for development!
}

storage "file" {
  path = "/vault/data"
}

# Development mode settings
disable_mlock = true

# API settings
api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}
