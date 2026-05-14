#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

DEFAULT_ROUTES=(
  "/"
  "/app/listings"
  "/service-providers"
  "/app/safety"
  "/construction"
  "/buyer-dashboard"
  "/profile-setup"
  "/kyc-upload"
  "/app/analytics"
  "/risk-analytics"
)

if [ "$#" -gt 0 ]; then
  ROUTES=("$@")
else
  ROUTES=("${DEFAULT_ROUTES[@]}")
fi

echo "Smoke checking ${#ROUTES[@]} routes against ${BASE_URL}"
echo

failures=0
for route in "${ROUTES[@]}"; do
  code="$(curl -s -o /tmp/pribec_smoke_web_route.html -w "%{http_code}" "${BASE_URL}${route}")"
  size="$(wc -c < /tmp/pribec_smoke_web_route.html | tr -d ' ')"

  if [ "${code}" -ge 400 ]; then
    failures=$((failures + 1))
    printf "\033[31m%3s\033[0m  %7s  %s\n" "${code}" "${size}" "${route}"
  else
    printf "\033[32m%3s\033[0m  %7s  %s\n" "${code}" "${size}" "${route}"
  fi
done

echo
if [ "${failures}" -gt 0 ]; then
  echo "Smoke check failed: ${failures} route(s) returned 4xx/5xx"
  exit 1
fi

echo "Smoke check passed"
