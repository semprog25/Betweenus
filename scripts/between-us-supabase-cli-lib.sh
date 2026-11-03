#!/usr/bin/env bash
# Shared isolated Supabase CLI runner for Between Us (temp HOME — no global supabase login).
# Sourced by agent/owner wrappers only; not for direct execution.
between_us_run_isolated_supabase() {
  local token=$1
  shift
  if [[ -z "$token" || "$token" =~ ^[[:space:]]*$ ]]; then
    echo "FAIL: access token is empty" >&2
    return 1
  fi
  if ! command -v supabase >/dev/null 2>&1; then
    echo "FAIL: supabase CLI not found" >&2
    return 1
  fi
  local _isolated_home
  _isolated_home=$(mktemp -d)
  # shellcheck disable=SC2064
  trap "rm -rf '$_isolated_home'" RETURN
  export HOME="$_isolated_home"
  export SUPABASE_ACCESS_TOKEN="$token"
  supabase "$@"
}
