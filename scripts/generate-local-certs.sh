#!/bin/bash
# Generate local development SSL certificates using mkcert
# Requires: mkcert (https://github.com/FiloSottile/mkcert)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/../docker/certs"

echo "=== PRIBEC Local SSL Certificate Generator ==="

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "Error: mkcert is not installed."
    echo ""
    echo "Install mkcert:"
    echo "  macOS:   brew install mkcert"
    echo "  Linux:   https://github.com/FiloSottile/mkcert#installation"
    echo "  Windows: choco install mkcert"
    exit 1
fi

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

echo "Installing local CA..."
mkcert -install

echo "Generating certificates..."
cd "$CERTS_DIR"

# Generate certificates for local development domains
mkcert \
    -cert-file localhost.pem \
    -key-file localhost-key.pem \
    localhost \
    127.0.0.1 \
    ::1 \
    pribec.local \
    api.pribec.local \
    "*.pribec.local"

echo ""
echo "=== Certificates generated successfully ==="
echo "Location: $CERTS_DIR"
echo ""
echo "Files created:"
echo "  - localhost.pem (certificate)"
echo "  - localhost-key.pem (private key)"
echo ""
echo "Add these to your /etc/hosts file:"
echo "  127.0.0.1 pribec.local api.pribec.local"
echo ""
echo "Note: These certificates are for local development only."
echo "Never use them in production."
