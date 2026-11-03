# Between Us — Supabase credentials (owner)

Project ref: **`qoqbdiixztolvtcjdnle`**.  
Goal: **Between Us CLI never relies on shared global `supabase login`** so SeaDays credential retirement stays safe.

**Cursor agents:** read this doc; do **not** create, read, or paste PATs. Run **`scripts/test-between-us-supabase-cli-wrapper.sh`** only (dummy tokens).

---

## Roles

| Role | Tooling | Token env var | Keychain service (suggested) |
|------|---------|---------------|------------------------------|
| **Agent / read-only** | `verify-between-us-agent-supabase-readonly.sh`, `between-us-agent-supabase-cli.sh` | `BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN` | `between-us-agent-supabase-pat` |
| **Owner Edge deploy** | `between-us-edge-deploy.sh --execute`, `between-us-owner-supabase-cli.sh` | `BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN` | `between-us-owner-edge-release-pat` |
| **DB / secrets admin** | **Supabase Dashboard** (preferred) or owner CLI for one-off | Owner PAT with DB/secrets scopes only in **Terminal.app** | separate Keychain entry if CLI needed |

**`npm run deploy:function`** is an alias for **`between-us-edge-deploy.sh --execute`** (owner token + approval gates; no global `supabase login`).

---

## Phase A — Agent PAT (read-only)

1. Dashboard → **Account** → **Access Tokens** → **Generate new token**.
2. **Project access:** **Between Us** (`qoqbdiixztolvtcjdnle`) only — not org-wide, not SeaDays.
3. **Scopes (minimum):**
   - **Edge Functions:** **Read**
   - **Database:** **Read** (optional; for CLI inspect only)
   - **Edge Function Secrets:** **None**
   - **Everything else:** **None** unless you have a documented read-only need
4. Name: `BetweenUs-agent-readonly-YYYYMMDD`.
5. Copy token **once**; store outside git:
   - macOS Keychain: service **`between-us-agent-supabase-pat`**
   - Or gitignored file **`.between-us-agent-supabase.local`** (one line, `chmod 600`) — never commit
6. **Do not** export this token into Cursor’s integrated terminal for routine agent work.

### Verify (Terminal.app only)

```bash
cd /Users/sharanestone/Semprog/Betweenus-main
set +x
unset SUPABASE_ACCESS_TOKEN BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN
export BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN="$(security find-generic-password -s between-us-agent-supabase-pat -w 2>/dev/null)"
./scripts/verify-between-us-agent-supabase-readonly.sh
```

Expected: Between Us functions list **HTTP 200**; optional SeaDays cross-check **not 200** when `SEADAYS_AGENT_SUPABASE_ACCESS_TOKEN` is set.

Negative (no Keychain):  
`BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN=sbp_dummy… ./scripts/verify-between-us-agent-supabase-readonly.sh` → exit **1**.

Local wrapper self-test (dummy only):  
`./scripts/test-between-us-supabase-cli-wrapper.sh`

---

## Phase B — Owner release PAT (Edge deploy)

1. Same token UI → **Project** → **Between Us** only.
2. **Edge Functions:** **Read-write** (deploy).
3. **Edge Function Secrets:** **Read-write** only if you deploy secrets via CLI; otherwise set secrets in **Dashboard** and use **None** here.
4. **Database:** **None** on this token if all schema changes go through Dashboard / controlled migrations.
5. Name: `BetweenUs-owner-edge-release-YYYYMMDD`.
6. Keychain service **`between-us-owner-edge-release-pat`** — **never** in Cursor, MCP, GitHub Actions, or repo files.

### Deploy (owner terminal)

```bash
cd /Users/sharanestone/Semprog/Betweenus-main
set +x
unset BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN SUPABASE_ACCESS_TOKEN
export BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN="$(security find-generic-password -s between-us-owner-edge-release-pat -w 2>/dev/null)"
export BETWEEN_US_PRODUCTION_EDGE_DEPLOY_APPROVED=1
export BETWEEN_US_EDGE_DEPLOY_EXECUTE=1
./scripts/between-us-edge-deploy.sh --execute
```

Plan-only (safe default, no credentials required):

```bash
./scripts/between-us-edge-deploy.sh --plan-only
```

Or via npm: `npm run edge-deploy:plan`

---

## Phase C — Database & secrets (Dashboard-first)

| Task | Preferred |
|------|-----------|
| Edge function secrets (`STRIPE_*`, `REVENUECAT_*`, etc.) | Dashboard → Edge Functions → Secrets |
| OAuth providers, Auth URLs | Dashboard → Authentication |
| Storage buckets | Dashboard or `create-post-images-bucket` script with **`SUPABASE_SERVICE_ROLE_KEY`** (project API key, not Management PAT) |
| SQL migrations | Dashboard SQL editor or dedicated DB-scoped PAT in owner terminal — **not** agent PAT |

Doc reference: `docs/PAYMENTS_SETUP.md` (update CLI examples to use owner wrapper when migrating off global login).

---

## Phase D — Retire global CLI login (after migration)

1. `./scripts/test-between-us-supabase-cli-wrapper.sh` → **PASS**
2. `./scripts/verify-between-us-agent-supabase-readonly.sh` → **PASS** (real agent PAT)
3. One successful **`between-us-edge-deploy.sh --execute`** with owner release PAT
4. Confirm production deploys use owner gates (`npm run deploy:function` or `./scripts/between-us-edge-deploy.sh --execute`)
5. Only then coordinate SeaDays **`supabase logout`** / legacy token revocation (SeaDays runbook)

---

## Env var summary

| Variable | Role |
|----------|------|
| `BETWEEN_US_AGENT_SUPABASE_ACCESS_TOKEN` | Agent read-only CLI / verify |
| `BETWEEN_US_OWNER_RELEASE_SUPABASE_ACCESS_TOKEN` | Owner isolated CLI + deploy |
| `BETWEEN_US_PRODUCTION_EDGE_DEPLOY_APPROVED=1` | Human gate for production deploy |
| `BETWEEN_US_EDGE_DEPLOY_EXECUTE=1` | Second gate before remote deploy |
| `SUPABASE_SERVICE_ROLE_KEY` | App/scripts API (not Management PAT) |

Never set SeaDays `SEADAYS_*` tokens in the same shell as Between Us owner release.
