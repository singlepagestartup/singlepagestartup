#!/bin/bash
. ../../tools/deployer/get_env.sh

set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"

RBAC_SUBJECT_IDENTITY_EMAIL=$(get_env "$BASH_SOURCE" "RBAC_SUBJECT_IDENTITY_EMAIL")
RBAC_SUBJECT_IDENTITY_PASSWORD=$(get_env "$BASH_SOURCE" "RBAC_SUBJECT_IDENTITY_PASSWORD")
RBAC_SECRET_KEY=$(get_env "$BASH_SOURCE" "RBAC_SECRET_KEY")

if [ -z "$RBAC_SUBJECT_IDENTITY_EMAIL" ]; then
    echo "Error: RBAC_SUBJECT_IDENTITY_EMAIL is not set" >&2
    exit 1
fi

if [ -z "$RBAC_SUBJECT_IDENTITY_PASSWORD" ]; then
    echo "Error: RBAC_SUBJECT_IDENTITY_PASSWORD is not set" >&2
    exit 1
fi

if [ -z "$RBAC_SECRET_KEY" ]; then
    echo "Error: RBAC_SECRET_KEY is not set" >&2
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required for delete_rbac_subject.sh" >&2
    exit 1
fi

collect_unique_ids() {
    printf "%s\n" "$@" | sed '/^$/d' | sort -u
}

delete_entity_by_id() {
    local endpoint="$1"
    local entity_id="$2"
    local label="$3"

    if [ -z "$entity_id" ]; then
        return 0
    fi

    local response http_code response_body
    response=$(curl -s -w "%{http_code}" -X DELETE "$API_URL/api/rbac/$endpoint/$entity_id" \
      -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY")

    http_code="${response: -3}"
    response_body="${response%???}"

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ] || [ "$http_code" = "404" ]; then
        echo "OK: $label $entity_id (HTTP $http_code)"
        return 0
    fi

    echo "Error: Failed to delete $label $entity_id (HTTP $http_code)" >&2
    if [ -n "$response_body" ]; then
        echo "Response: $response_body" >&2
    fi
    return 1
}

echo "Deleting RBAC subject data for identity email: $RBAC_SUBJECT_IDENTITY_EMAIL"

IDENTITIES_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/identities")
mapfile -t IDENTITY_IDS_FROM_EMAIL < <(
    echo "$IDENTITIES_RESPONSE" | jq -r --arg email "$RBAC_SUBJECT_IDENTITY_EMAIL" '
      .data[]? |
      select((.email // "") == $email or (.account // "") == $email or (.login // "") == $email) |
      .id
    '
)

AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/rbac/subjects/authentication/email-and-password/authentication" \
  -F "data={\"login\":\"$RBAC_SUBJECT_IDENTITY_EMAIL\",\"password\":\"$RBAC_SUBJECT_IDENTITY_PASSWORD\"}")
JWT_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.jwt // empty')

ME_SUBJECT_ID=""
if [ -n "$JWT_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/subjects/authentication/me" \
      -H "Authorization: Bearer $JWT_TOKEN")
    ME_SUBJECT_ID=$(echo "$ME_RESPONSE" | jq -r '.data.id // empty')
fi

SUBJECTS_TO_IDENTITIES_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/subjects-to-identities")

IDENTITY_IDS_FROM_RELATIONS=()
SUBJECTS_TO_IDENTITIES_IDS=()
SUBJECT_IDS=()

if [ "${#IDENTITY_IDS_FROM_EMAIL[@]}" -gt 0 ]; then
    for identity_id in "${IDENTITY_IDS_FROM_EMAIL[@]}"; do
        mapfile -t relation_ids_for_identity < <(
            echo "$SUBJECTS_TO_IDENTITIES_RESPONSE" | jq -r --arg identityId "$identity_id" '
              .data[]? | select(.identityId == $identityId) | .id
            '
        )
        mapfile -t subject_ids_for_identity < <(
            echo "$SUBJECTS_TO_IDENTITIES_RESPONSE" | jq -r --arg identityId "$identity_id" '
              .data[]? | select(.identityId == $identityId) | .subjectId
            '
        )

        SUBJECTS_TO_IDENTITIES_IDS+=("${relation_ids_for_identity[@]}")
        SUBJECT_IDS+=("${subject_ids_for_identity[@]}")
    done
fi

if [ -n "$ME_SUBJECT_ID" ]; then
    mapfile -t relation_ids_for_me < <(
        echo "$SUBJECTS_TO_IDENTITIES_RESPONSE" | jq -r --arg subjectId "$ME_SUBJECT_ID" '
          .data[]? | select(.subjectId == $subjectId) | .id
        '
    )
    mapfile -t identity_ids_for_me < <(
        echo "$SUBJECTS_TO_IDENTITIES_RESPONSE" | jq -r --arg subjectId "$ME_SUBJECT_ID" '
          .data[]? | select(.subjectId == $subjectId) | .identityId
        '
    )

    SUBJECTS_TO_IDENTITIES_IDS+=("${relation_ids_for_me[@]}")
    IDENTITY_IDS_FROM_RELATIONS+=("${identity_ids_for_me[@]}")
    SUBJECT_IDS+=("$ME_SUBJECT_ID")
fi

mapfile -t IDENTITY_IDS < <(
    collect_unique_ids "${IDENTITY_IDS_FROM_EMAIL[@]}" "${IDENTITY_IDS_FROM_RELATIONS[@]}"
)
mapfile -t SUBJECTS_TO_IDENTITIES_IDS < <(
    collect_unique_ids "${SUBJECTS_TO_IDENTITIES_IDS[@]}"
)
mapfile -t SUBJECT_IDS < <(
    collect_unique_ids "${SUBJECT_IDS[@]}"
)

SUBJECTS_TO_ROLES_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/subjects-to-roles")
SUBJECTS_TO_ROLES_IDS=()
if [ "${#SUBJECT_IDS[@]}" -gt 0 ]; then
    for subject_id in "${SUBJECT_IDS[@]}"; do
        mapfile -t relation_ids_for_subject < <(
            echo "$SUBJECTS_TO_ROLES_RESPONSE" | jq -r --arg subjectId "$subject_id" '
              .data[]? | select(.subjectId == $subjectId) | .id
            '
        )
        SUBJECTS_TO_ROLES_IDS+=("${relation_ids_for_subject[@]}")
    done
fi
mapfile -t SUBJECTS_TO_ROLES_IDS < <(
    collect_unique_ids "${SUBJECTS_TO_ROLES_IDS[@]}"
)

if [ "${#SUBJECTS_TO_ROLES_IDS[@]}" -eq 0 ] && [ "${#SUBJECTS_TO_IDENTITIES_IDS[@]}" -eq 0 ] && \
   [ "${#IDENTITY_IDS[@]}" -eq 0 ] && [ "${#SUBJECT_IDS[@]}" -eq 0 ]; then
    echo "No matching RBAC records found. Cleanup is already complete."
    exit 0
fi

for relation_id in "${SUBJECTS_TO_ROLES_IDS[@]}"; do
    delete_entity_by_id "subjects-to-roles" "$relation_id" "subjects-to-roles relation"
done

for relation_id in "${SUBJECTS_TO_IDENTITIES_IDS[@]}"; do
    delete_entity_by_id "subjects-to-identities" "$relation_id" "subjects-to-identities relation"
done

for identity_id in "${IDENTITY_IDS[@]}"; do
    delete_entity_by_id "identities" "$identity_id" "identity"
done

for subject_id in "${SUBJECT_IDS[@]}"; do
    delete_entity_by_id "subjects" "$subject_id" "subject"
done

echo "RBAC subject cleanup complete."
