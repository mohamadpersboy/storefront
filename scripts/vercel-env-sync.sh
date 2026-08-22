#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────
# Syncs every variable in .env.vercel.local into Vercel, across all
# three environments (production, preview, development), using the
# Vercel CLI. Existing values are overwritten (--force) so this is
# safe to re-run any time you update a value locally.
#
# Setup (one-time):
#   1. npm i -g vercel   (or: npx vercel ...)
#   2. vercel login
#   3. cp .env.vercel.local.example .env.vercel.local
#      then fill in real values
#   4. bash scripts/vercel-env-sync.sh
#
# NOTE on "preview": the Vercel CLI has a known interactive prompt for
# "which git branch?" that isn't fully suppressed by --yes/--force in
# some CLI versions. This script passes --yes so it applies to ALL
# preview branches; if your CLI version still prompts, just press
# Enter to accept "all branches", or re-run with a newer CLI version.
# ──────────────────────────────────────────────────────────────────

ENV_FILE="${1:-.env.vercel.local}"
ENVIRONMENTS=(production preview development)

if ! command -v vercel &>/dev/null; then
  echo "❌ Vercel CLI not found. Install it first: npm i -g vercel"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found."
  echo "   Copy .env.vercel.local.example to $ENV_FILE and fill in real values first."
  exit 1
fi

if [ ! -d ".vercel" ]; then
  echo "🔗 Project not linked to Vercel yet — running 'vercel link'..."
  vercel link
fi

echo "📡 Syncing variables from $ENV_FILE to Vercel (production, preview, development)..."
echo ""

while IFS='=' read -r key value; do
  # skip blank lines and comments
  [[ -z "$key" || "$key" == \#* ]] && continue
  # trim whitespace
  key="$(echo "$key" | xargs)"
  value="$(echo "$value" | xargs)"

  if [ -z "$value" ]; then
    echo "⚠️  Skipping $key — no value set in $ENV_FILE"
    continue
  fi

  for env in "${ENVIRONMENTS[@]}"; do
    echo "  → $key ($env)"
    printf '%s' "$value" | vercel env add "$key" "$env" --force --yes >/dev/null 2>&1 \
      || echo "     ⚠️  Failed for $env — you may need to set this one manually in the dashboard"
  done
done < "$ENV_FILE"

echo ""
echo "✅ Done. Trigger a new deployment (or push a commit) for the new values to take effect —"
echo "   Vercel only applies env var changes to deployments created AFTER the change."
