#!/usr/bin/env bash
set -euo pipefail

readonly READ_CALL_PATTERN='\b(?:[A-Za-z0-9_]+Api|api)\.(find|findById|total|quantity|urls|messageFind|checkoutAttributes|checkoutAttributesByCurrency|findByRoute|resolveByRoute)\('

controller_files_with_sdk_server="$(
  rg --files-with-matches "sdk/server" libs/modules \
    -g "**/backend/app/api/src/lib/controller/**/*.ts" || true
)"

if [[ -z "${controller_files_with_sdk_server}" ]]; then
  echo "OK: no controller files import sdk/server"
  exit 0
fi

read_call_matches="$(echo "${controller_files_with_sdk_server}" | xargs rg --line-number --no-heading "${READ_CALL_PATTERN}" || true)"

if [[ -n "${read_call_matches}" ]]; then
  echo "ERROR: backend controller read calls via sdk/server are not allowed"
  echo "${read_call_matches}"
  exit 1
fi

echo "OK: no backend controller read calls via sdk/server found"
