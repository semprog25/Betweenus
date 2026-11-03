#!/usr/bin/env bash
# Between Us Edge deploy — default plan-only; execute requires owner env (no global supabase login).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
OWNER_CLI="$SCRIPT_DIR/between-us-owner-supabase-cli.sh"

PROJECT_REF="qoqbdiixztolvtcjdnle"
FUNCTION_NAME="make-server-6c9b0e48"

usage() {
  cat <<EOF
Usage: $(basename "$0") --plan-only | --execute

Default: --plan-only (no remote writes, no source sync).

Execute requires ALL of:
  BETWEEN_US_PRODUCTION_EDGE_DEPLOY_APPROVED=1
  BETWEEN_US_EDGE_DEPLOY_EXECUTE=1
  BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN (via Keychain export in Terminal.app only)

Does not use global supabase login. npm run deploy:function invokes this script with --execute.

See docs/BETWEENUS_SUPABASE_CREDENTIALS.md
EOF
}

mode="plan"
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

case "${1:-}" in
  --plan-only) mode="plan" ;;
  --execute) mode="execute" ;;
  *)
    echo "First argument must be --plan-only or --execute" >&2
    usage >&2
    exit 1
    ;;
esac

sync_function_sources() {
  cp "${REPO_ROOT}/src/supabase/functions/server/"*.tsx \
    "${REPO_ROOT}/supabase/functions/${FUNCTION_NAME}/"
  if [[ -f "${REPO_ROOT}/supabase/functions/${FUNCTION_NAME}/index.tsx" ]]; then
    mv "${REPO_ROOT}/supabase/functions/${FUNCTION_NAME}/index.tsx" \
      "${REPO_ROOT}/supabase/functions/${FUNCTION_NAME}/index.ts"
  fi
}

deploy_cmd=(
  functions deploy "$FUNCTION_NAME"
  --project-ref "$PROJECT_REF"
  --workdir "$REPO_ROOT"
  --yes
)

echo "Between Us Edge deploy (${mode})"
echo "  project-ref: ${PROJECT_REF}"
echo "  function:    ${FUNCTION_NAME}"
echo "  workdir:     ${REPO_ROOT}"

if [[ "$mode" == "plan" ]]; then
  echo ""
  echo "PLAN-ONLY — no file sync, no network deploy."
  echo "Would sync: src/supabase/functions/server/*.tsx -> supabase/functions/${FUNCTION_NAME}/"
  echo "Would run:  between-us-owner-supabase-cli.sh ${deploy_cmd[*]}"
  exit 0
fi

if [[ "${BETWEEN_US_PRODUCTION_EDGE_DEPLOY_APPROVED:-}" != "1" ]]; then
  echo "BLOCKED: set BETWEEN_US_PRODUCTION_EDGE_DEPLOY_APPROVED=1" >&2
  exit 1
fi

if [[ "${BETWEEN_US_EDGE_DEPLOY_EXECUTE:-}" != "1" ]]; then
  echo "BLOCKED: set BETWEEN_US_EDGE_DEPLOY_EXECUTE=1 to deploy" >&2
  exit 1
fi

if [[ ! -x "$OWNER_CLI" ]]; then
  echo "BLOCKED: missing owner CLI wrapper: $OWNER_CLI" >&2
  exit 1
fi

sync_function_sources
echo "Executing owner-isolated deploy..."
exec "$OWNER_CLI" "${deploy_cmd[@]}"
