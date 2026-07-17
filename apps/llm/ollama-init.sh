#!/bin/sh

set -eu

model_ids="${OLLAMA_MODEL_IDS:-nomic-embed-text}"
reconcile_interval_seconds="${OLLAMA_MODEL_RECONCILE_INTERVAL_SECONDS:-60}"

case "$reconcile_interval_seconds" in
  "" | *[!0-9]*)
    echo "OLLAMA_MODEL_RECONCILE_INTERVAL_SECONDS must be a positive integer." >&2
    exit 1
    ;;
esac

if [ "$reconcile_interval_seconds" -lt 1 ]; then
  echo "OLLAMA_MODEL_RECONCILE_INTERVAL_SECONDS must be at least 1." >&2
  exit 1
fi

echo "Ollama model reconciler started for: $model_ids"

while true; do
  until ollama list >/dev/null 2>&1; do
    sleep 2
  done

  previous_ifs="$IFS"
  IFS=','
  set -- $model_ids
  IFS="$previous_ifs"

  for model_id in "$@"; do
    model_id="$(printf '%s' "$model_id" | xargs)"

    if [ -z "$model_id" ]; then
      continue
    fi

    if ! ollama show "$model_id" >/dev/null 2>&1; then
      echo "Pulling missing Ollama model: $model_id"
      ollama pull "$model_id"
    fi
  done

  sleep "$reconcile_interval_seconds"
done
