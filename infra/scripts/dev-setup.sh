#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

REPOS=(
  urule-spec
  urule-events
  urule-orchestrator-contract
  urule-authz
  urule-registry
  urule-langgraph-adapter
  urule-runtime-broker
  urule-packages
  urule-packagehub
  urule-mcp-gateway
  urule-approvals
  urule-governance
  urule-channel-router
  urule-state
  backstage-urule-plugin
)

GITHUB_ORG="${GITHUB_ORG:-uruleos}"

echo "=== Urule Dev Setup ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Install dependencies for each repo that exists
for repo in "${REPOS[@]}"; do
  repo_dir="$PROJECT_ROOT/$repo"
  if [ -d "$repo_dir" ] && [ -f "$repo_dir/package.json" ]; then
    echo "Installing dependencies for $repo..."
    (cd "$repo_dir" && npm install)
  fi
done

# Link library packages for local development
LIBRARIES=(urule-spec urule-events urule-orchestrator-contract urule-authz)

for lib in "${LIBRARIES[@]}"; do
  lib_dir="$PROJECT_ROOT/$lib"
  if [ -d "$lib_dir" ] && [ -f "$lib_dir/package.json" ]; then
    echo "Linking $lib..."
    (cd "$lib_dir" && npm link)
  fi
done

# Link libraries into services that depend on them
for repo in "${REPOS[@]}"; do
  repo_dir="$PROJECT_ROOT/$repo"
  if [ -d "$repo_dir" ] && [ -f "$repo_dir/package.json" ]; then
    for lib in "${LIBRARIES[@]}"; do
      lib_dir="$PROJECT_ROOT/$lib"
      if [ -d "$lib_dir" ]; then
        pkg_name=$(cd "$lib_dir" && node -p "require('./package.json').name" 2>/dev/null || true)
        if [ -n "$pkg_name" ]; then
          dep_check=$(cd "$repo_dir" && node -p "
            const pkg = require('./package.json');
            const deps = {...(pkg.dependencies||{}), ...(pkg.devDependencies||{})};
            deps['$pkg_name'] ? 'yes' : 'no'
          " 2>/dev/null || echo "no")
          if [ "$dep_check" = "yes" ]; then
            echo "Linking $pkg_name into $repo..."
            (cd "$repo_dir" && npm link "$pkg_name")
          fi
        fi
      fi
    done
  fi
done

echo ""
echo "=== Setup complete ==="
echo ""
echo "To start infrastructure services:"
echo "  cd $SCRIPT_DIR/../compose && docker compose -f docker-compose.infra.yaml up -d"
echo ""
echo "To check health:"
echo "  bash $SCRIPT_DIR/health-check.sh"
