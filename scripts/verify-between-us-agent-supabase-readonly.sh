#!/usr/bin/env bash
# Verify Between Us agent PAT via Management API GET only (no CLI, no deploy).
set -euo pipefail

BETWEEN_US_REF="qoqbdiixztolvtcjdnle"
SEADAYS_REF="soqkgrfzluewpuiguypm"
API_BASE="https://api.supabase.com/v1/projects"

if [[ -n "${BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FAIL: unset BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN before agent verify"
  exit 1
fi

if [[ -z "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FAIL: BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN is unset"
  echo "Owner: docs/BETWEENUS_SUPABASE_CREDENTIALS.md Phase A"
  exit 1
fi

if [[ "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" =~ ^[[:space:]]*$ ]]; then
  echo "FAIL: BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN is empty"
  exit 1
fi

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  if [[ "${SUPABASE_ACCESS_TOKEN}" != "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" ]]; then
    echo "FAIL: SUPABASE_ACCESS_TOKEN differs from BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN"
    exit 1
  fi
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "FAIL: curl not found"
  exit 1
fi

echo "ok agent token length=${#BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN} (value not printed)"

list_functions_http_code() {
  local token=$1
  local project_ref=$2
  curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: application/json" \
    "${API_BASE}/${project_ref}/functions"
}

echo "Checking Between Us Edge Functions list (Management API GET)..."
bu_code=$(list_functions_http_code "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" "${BETWEEN_US_REF}")
if [[ "${bu_code}" != "200" ]]; then
  echo "FAIL: Between Us functions list HTTP ${bu_code} (expected 200 with scoped agent token)"
  exit 1
fi
echo "ok Between Us functions list HTTP 200"

if [[ -n "${SEADAYS_AGENT_SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Checking BU agent token cannot access SeaDays (isolation)..."
  cross_code=$(list_functions_http_code "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" "${SEADAYS_REF}")
  if [[ "${cross_code}" == "200" ]]; then
    echo "FAIL: Between Us agent token returned HTTP 200 on SeaDays — token is not BU-only scoped"
    exit 1
  fi
  echo "ok Between Us token blocked on SeaDays (HTTP ${cross_code})"
else
  echo "skip SeaDays cross-check (SEADAYS_AGENT_SUPABASE_ACCESS_TOKEN unset)"
fi

echo "PASS: read-only Management API checks (no deploy, no Supabase CLI, no owner-release token)"
