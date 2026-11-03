#!/usr/bin/env bash
# Local wrapper tests — dummy tokens only; no Keychain, deploy, or production writes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
AGENT_CLI="$SCRIPT_DIR/between-us-agent-supabase-cli.sh"
OWNER_CLI="$SCRIPT_DIR/between-us-owner-supabase-cli.sh"
VERIFY="$SCRIPT_DIR/verify-between-us-agent-supabase-readonly.sh"
EDGE_PLAN="$SCRIPT_DIR/between-us-edge-deploy.sh"

DUMMY_AGENT="sbp_dummy_between_us_agent_token_for_local_test_only_0123456789abcdef"
DUMMY_OWNER="sbp_dummy_between_us_owner_release_token_local_test_0123456789abcdef"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "ok $*"
}

cd "$REPO_ROOT"

if [[ ! -x "$AGENT_CLI" || ! -x "$OWNER_CLI" ]]; then
  fail "CLI wrappers not executable — run chmod +x scripts/between-us-*-supabase-cli.sh"
fi

echo "=== guard: agent CLI without token ==="
if BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN= "$AGENT_CLI" --version 2>/dev/null; then
  fail "agent CLI should fail when token unset"
fi
pass "agent CLI rejects missing token"

echo "=== guard: agent CLI with owner token set ==="
if BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN="$DUMMY_AGENT" \
  BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN=x \
  "$AGENT_CLI" --version 2>/dev/null; then
  fail "agent CLI should fail when owner token set"
fi
pass "agent CLI rejects owner token in same shell"

echo "=== guard: owner CLI without token ==="
if BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN= "$OWNER_CLI" --version 2>/dev/null; then
  fail "owner CLI should fail when token unset"
fi
pass "owner CLI rejects missing token"

echo "=== isolated CLI: supabase --version with dummy agent token ==="
if ! BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN="$DUMMY_AGENT" "$AGENT_CLI" --version >/dev/null; then
  fail "agent wrapper should run local supabase --version with dummy token"
fi
pass "agent wrapper runs supabase --version (isolated HOME)"

echo "=== verify script: dummy agent token must not PASS ==="
set +e
BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN="$DUMMY_AGENT" "$VERIFY" >/dev/null 2>&1
verify_status=$?
set -e
if [[ $verify_status -eq 0 ]]; then
  fail "verify script must fail with dummy token"
fi
pass "verify script fails closed on dummy token (exit ${verify_status})"

echo "=== edge deploy: plan-only (no credentials) ==="
plan_out="$("$EDGE_PLAN" --plan-only)"
if [[ "$plan_out" != *"PLAN-ONLY"* ]]; then
  fail "edge deploy plan-only should not require tokens"
fi
pass "edge-deploy --plan-only without credentials"

echo "=== edge deploy: execute blocked without owner env ==="
set +e
BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN="$DUMMY_OWNER" \
  "$EDGE_PLAN" --execute >/dev/null 2>&1
exec_status=$?
set -e
if [[ $exec_status -eq 0 ]]; then
  fail "execute must be blocked without approval env vars"
fi
pass "edge-deploy --execute blocked without BETWEEN_US_*_APPROVED (exit ${exec_status})"

echo "=== package.json: deploy:function must not invoke bare supabase ==="
deploy_fn_line=$(node -e "const p=require('./package.json'); process.stdout.write(p.scripts['deploy:function']||'')")
if [[ "$deploy_fn_line" == *"supabase functions deploy"* ]] || [[ "$deploy_fn_line" == *" supabase "* ]]; then
  fail "deploy:function still references bare supabase CLI"
fi
if [[ "$deploy_fn_line" != *"between-us-edge-deploy.sh"* ]] || [[ "$deploy_fn_line" != *"--execute"* ]]; then
  fail "deploy:function must route through between-us-edge-deploy.sh --execute"
fi
pass "deploy:function uses guarded edge-deploy script"

echo "=== npm run deploy:function blocked without approval env ==="
set +e
BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN="$DUMMY_OWNER" \
  npm run deploy:function --silent >/dev/null 2>&1
npm_deploy_status=$?
set -e
if [[ $npm_deploy_status -eq 0 ]]; then
  fail "npm run deploy:function must fail without BETWEEN_US_* approval gates"
fi
pass "npm run deploy:function blocked without approvals (exit ${npm_deploy_status})"

echo "PASS: local wrapper tests completed (dummy tokens only)"
