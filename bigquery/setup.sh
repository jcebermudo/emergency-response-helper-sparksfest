#!/usr/bin/env bash
# bigquery/setup.sh
# ---------------------------------------------------------------------------
# One-time setup: create the BigQuery dataset + tables for emergency-response.
# Run once per GCP project after `gcloud auth login` and setting PROJECT_ID.
#
# Usage:
#   export PROJECT_ID=your-gcp-project-id
#   bash bigquery/setup.sh
# ---------------------------------------------------------------------------

set -euo pipefail

: "${PROJECT_ID:?Please set PROJECT_ID env var before running this script}"

DATASET="emergency_response"
LOCATION="asia-southeast1"   # closest region to the Philippines
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Project : $PROJECT_ID"
echo "==> Dataset : $DATASET ($LOCATION)"
echo ""

# ── 1. Create dataset (skip if already exists) ─────────────────────────────
if bq --project_id="$PROJECT_ID" ls --datasets | grep -q "$DATASET"; then
  echo "[skip] Dataset $DATASET already exists"
else
  bq --project_id="$PROJECT_ID" mk \
    --dataset \
    --location="$LOCATION" \
    --description="Emergency response operational data" \
    "$PROJECT_ID:$DATASET"
  echo "[ok]   Created dataset $DATASET"
fi

# ── 2. Create tasks_history table ──────────────────────────────────────────
if bq --project_id="$PROJECT_ID" show "$DATASET.tasks_history" &>/dev/null; then
  echo "[skip] Table tasks_history already exists"
else
  bq --project_id="$PROJECT_ID" mk \
    --table \
    --description="Resolved/updated task records streamed from Firestore nightly" \
    --time_partitioning_field=updated_at \
    --time_partitioning_type=DAY \
    "$PROJECT_ID:$DATASET.tasks_history" \
    "$SCRIPT_DIR/schema_tasks_history.json"
  echo "[ok]   Created table tasks_history"
fi

# ── 3. Create external_advisories table ────────────────────────────────────
if bq --project_id="$PROJECT_ID" show "$DATASET.external_advisories" &>/dev/null; then
  echo "[skip] Table external_advisories already exists"
else
  bq --project_id="$PROJECT_ID" mk \
    --table \
    --description="PAGASA / NDRRMC advisories loaded nightly" \
    --time_partitioning_field=issued_at \
    --time_partitioning_type=DAY \
    "$PROJECT_ID:$DATASET.external_advisories" \
    "$SCRIPT_DIR/schema_external_advisories.json"
  echo "[ok]   Created table external_advisories"
fi

echo ""
echo "Done. Tables are ready in $PROJECT_ID:$DATASET"
