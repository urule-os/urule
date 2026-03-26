#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../compose"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.tests.yaml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

usage() {
  echo "Usage: $0 [service-name]"
  echo ""
  echo "Run all unit tests in Docker containers."
  echo ""
  echo "Examples:"
  echo "  $0                      # Run all repo tests"
  echo "  $0 test-spec            # Run only urule-spec tests"
  echo "  $0 test-registry        # Run only urule-registry tests (with Postgres)"
  echo ""
  echo "Services: test-spec, test-events, test-orchestrator-contract,"
  echo "          test-langgraph-adapter, test-runtime-broker, test-registry"
  exit 0
}

case "${1:-}" in
  --help|-h) usage ;;
esac

TARGET="${1:-}"

info "Building and running tests in Docker..."

if [ -n "$TARGET" ]; then
  docker compose -f "$COMPOSE_FILE" up --build --abort-on-container-exit --exit-code-from "$TARGET" "$TARGET"
else
  docker compose -f "$COMPOSE_FILE" up --build --abort-on-container-exit
fi

EXIT_CODE=$?

# Clean up
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true

if [ $EXIT_CODE -eq 0 ]; then
  info "All tests passed!"
else
  error "Some tests failed (exit code: $EXIT_CODE)."
fi

exit $EXIT_CODE
