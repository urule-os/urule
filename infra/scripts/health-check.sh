#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    echo -e "  ${GREEN}[OK]${NC}  $name ($url)"
  else
    echo -e "  ${RED}[FAIL]${NC} $name ($url) — got $status, expected $expected"
  fi
}

echo "=== Urule Infrastructure Health Check ==="
echo ""

echo "Platform Services:"
check_service "PostgreSQL" "http://localhost:5432" "000"  # TCP only, will fail HTTP but that's expected
echo -e "  ${YELLOW}[INFO]${NC} PostgreSQL: checking via pg_isready..."
pg_isready -h localhost -p 5432 -U urule 2>/dev/null && \
  echo -e "  ${GREEN}[OK]${NC}  PostgreSQL (localhost:5432)" || \
  echo -e "  ${RED}[FAIL]${NC} PostgreSQL (localhost:5432)"

check_service "NATS" "http://localhost:8222/healthz"
check_service "Temporal UI" "http://localhost:8080"
check_service "Keycloak" "http://localhost:8081/health/ready"
check_service "OpenFGA" "http://localhost:8082/healthz"
check_service "OPA" "http://localhost:8181/health"
check_service "Jaeger UI" "http://localhost:16686"

echo ""
echo "Application Services:"
check_service "urule-registry" "http://localhost:3001/healthz"
check_service "urule-runtime-broker" "http://localhost:3002/healthz"
check_service "urule-langgraph-adapter" "http://localhost:3003/healthz"

echo ""
echo "=== Done ==="
