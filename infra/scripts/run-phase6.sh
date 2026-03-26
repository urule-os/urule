#!/usr/bin/env bash
###############################################################################
# Phase 6 — End-to-End UX Test Runner
#
# Usage:
#   ./scripts/run-phase6.sh              # Start everything
#   ./scripts/run-phase6.sh --up-only    # Start services only
#   ./scripts/run-phase6.sh --down       # Tear down
###############################################################################

set -euo pipefail
cd "$(dirname "$0")/../compose"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[phase6]${NC} $1"; }
ok()  { echo -e "${GREEN}[phase6]${NC} $1"; }
warn(){ echo -e "${YELLOW}[phase6]${NC} $1"; }
err() { echo -e "${RED}[phase6]${NC} $1"; }

COMPOSE_FILE="docker-compose.phase6.yaml"

# Tear down
if [[ "${1:-}" == "--down" ]]; then
  log "Tearing down Phase 6 stack..."
  docker compose -f "$COMPOSE_FILE" down -v
  ok "Stack torn down."
  exit 0
fi

# Start services
log "Starting Phase 6 stack..."
docker compose -f "$COMPOSE_FILE" up --build -d

log "Waiting for services to be healthy..."

# Wait for health checks
services=(registry adapter approvals state packagehub)
for svc in "${services[@]}"; do
  log "  Waiting for $svc..."
  timeout=60
  until docker compose -f "$COMPOSE_FILE" exec -T "$svc" node -e "fetch('http://localhost:3000/healthz').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))" 2>/dev/null; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
      err "  $svc failed to become healthy"
      break
    fi
  done
  ok "  $svc is healthy"
done

echo ""
ok "=================================================="
ok "  Phase 6 UX Test Stack is Ready!"
ok "=================================================="
echo ""
log "Services:"
log "  Office UI:    http://localhost:${URULE_UI_PORT:-3000}"
log "  Registry:     http://localhost:${URULE_REGISTRY_PORT:-3001}"
log "  Adapter:      http://localhost:${URULE_ADAPTER_PORT:-3002}"
log "  Approvals:    http://localhost:${URULE_APPROVALS_PORT:-3003}"
log "  State:        http://localhost:${URULE_STATE_PORT:-3007}"
log "  PackageHub:   http://localhost:${URULE_PACKAGEHUB_PORT:-3009}"
echo ""
warn "Next steps:"
warn "  1. Open http://localhost:${URULE_UI_PORT:-3000}"
warn "  2. Click 'Demo Login (No Auth Required)'"
warn "  3. Settings → Add Provider → Select Claude → Enter your Anthropic API key"
warn "  4. Agents → New Agent → Browse PackageHub personalities → Deploy"
warn "  5. Chat → New Chat → Select your agent → Start talking!"
warn "  6. Ask the agent to do a complex task → Watch it hire specialists!"
echo ""

# Open browser if available
if command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:${URULE_UI_PORT:-3000}" 2>/dev/null || true
fi
