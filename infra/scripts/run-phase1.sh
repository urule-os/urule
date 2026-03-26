#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../compose"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.phase1.yaml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

cleanup() {
  if [ "${KEEP_RUNNING:-}" != "1" ]; then
    info "Tearing down services..."
    docker compose -f "$COMPOSE_FILE" --profile test down -v --remove-orphans 2>/dev/null || true
  else
    info "KEEP_RUNNING=1 — services left running."
    info "Tear down manually: docker compose -f $COMPOSE_FILE --profile test down -v"
  fi
}

usage() {
  echo "Usage: $0 [--up-only | --test-only | --down]"
  echo ""
  echo "  (no args)    Build, start services, run E2E tests in Docker, tear down"
  echo "  --up-only    Start services and exit (keep running)"
  echo "  --test-only  Run E2E tests against already-running services"
  echo "  --down       Tear down services"
  echo ""
  echo "Env vars:"
  echo "  KEEP_RUNNING=1   Don't tear down after tests"
  exit 0
}

# Parse args
MODE="full"
case "${1:-}" in
  --up-only)   MODE="up" ;;
  --test-only) MODE="test" ;;
  --down)      MODE="down" ;;
  --help|-h)   usage ;;
  "") ;;
  *) error "Unknown arg: $1"; usage ;;
esac

# --- Down ---
if [ "$MODE" = "down" ]; then
  info "Tearing down Phase 1 services..."
  docker compose -f "$COMPOSE_FILE" --profile test down -v --remove-orphans
  exit 0
fi

# --- Up ---
if [ "$MODE" = "full" ] || [ "$MODE" = "up" ]; then
  info "Building and starting Phase 1 services..."
  docker compose -f "$COMPOSE_FILE" up --build -d

  if [ "$MODE" = "up" ]; then
    info "Services are running. Ports:"
    echo "  Registry:           http://localhost:${URULE_REGISTRY_PORT:-3001}"
    echo "  LangGraph Adapter:  http://localhost:${URULE_ADAPTER_PORT:-3002}"
    echo "  Runtime Broker:     http://localhost:${URULE_BROKER_PORT:-4500}"
    echo "  PostgreSQL:         localhost:${URULE_PG_PORT:-5500}"
    echo "  NATS Monitor:       http://localhost:${URULE_NATS_MONITOR_PORT:-8222}"
    echo "  Temporal UI:        http://localhost:${URULE_TEMPORAL_UI_PORT:-8280}"
    echo "  Keycloak:           http://localhost:${URULE_KEYCLOAK_PORT:-8281}"
    echo "  Jaeger:             http://localhost:${URULE_JAEGER_UI_PORT:-16686}"
    echo ""
    echo "Run tests: $0 --test-only"
    echo "Tear down: $0 --down"
    exit 0
  fi
fi

# --- Test ---
if [ "$MODE" = "full" ] || [ "$MODE" = "test" ]; then
  if [ "$MODE" = "full" ]; then
    trap cleanup EXIT
  fi

  info "Running Phase 1 E2E tests inside Docker..."

  # Run the e2e-tests container (part of the 'test' profile)
  # It waits for all services to be healthy before starting
  docker compose -f "$COMPOSE_FILE" --profile test up --build --abort-on-container-exit --exit-code-from e2e-tests e2e-tests
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    info "All E2E tests passed!"
  else
    error "Some E2E tests failed (exit code: $EXIT_CODE)."
  fi

  exit $EXIT_CODE
fi
