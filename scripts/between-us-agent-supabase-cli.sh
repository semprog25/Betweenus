#!/usr/bin/env bash
# Between Us agent CLI — scoped PAT only; blocks owner-release and SeaDays credential env vars.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=between-us-supabase-cli-lib.sh
source "$SCRIPT_DIR/between-us-supabase-cli-lib.sh"

if [[ -z "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FAIL: BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN is unset" >&2
  echo "Owner: docs/BETWEENUS_SUPABASE_CREDENTIALS.md Phase A" >&2
  exit 1
fi

if [[ "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" =~ ^[[:space:]]*$ ]]; then
  echo "FAIL: BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN is empty" >&2
  exit 1
fi

if [[ -n "${BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "FAIL: unset BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN in agent shells" >&2
  exit 1
fi

for _sd_var in SEADAYS_AGENT_SUPABASE_ACCESS_TOKEN SEADAYS_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN; do
  if [[ -n "${!_sd_var:-}" ]]; then
    echo "FAIL: unset ${_sd_var} before Between Us agent CLI" >&2
    exit 1
  fi
done

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && "${SUPABASE_ACCESS_TOKEN}" != "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" ]]; then
  echo "FAIL: SUPABASE_ACCESS_TOKEN must be unset or equal to BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN" >&2
  exit 1
fi

between_us_run_isolated_supabase "${BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN}" "$@"
