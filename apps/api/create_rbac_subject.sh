#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/../../tools/deployer/get_env.sh"

API_URL="${API_URL:-${API_SERVICE_URL:-http://localhost:4000}}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-10}"
CURL_MAX_TIME="${CURL_MAX_TIME:-60}"

RBAC_SUBJECT_IDENTITY_EMAIL=$(get_env "${BASH_SOURCE[0]}" "RBAC_SUBJECT_IDENTITY_EMAIL")
RBAC_SUBJECT_IDENTITY_PASSWORD=$(get_env "${BASH_SOURCE[0]}" "RBAC_SUBJECT_IDENTITY_PASSWORD")
RBAC_SECRET_KEY=$(get_env "${BASH_SOURCE[0]}" "RBAC_SECRET_KEY")

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
    echo "Error: jq is required for create_rbac_subject.sh" >&2
    exit 1
fi

HTTP_CODE=""
RESPONSE_BODY=""
AUTH_JWT_TOKEN=""
AUTH_SUBJECT_ID=""
AUTH_RESPONSE_BODY=""
ADMIN_ROLE_ID=""
IDENTITY_ID=""
SUBJECT_ID=""

request() {
    local method="$1"
    local path="$2"
    shift 2

    local response_file
    response_file="$(mktemp)"

    if ! HTTP_CODE=$(curl -sS \
        --connect-timeout "$CURL_CONNECT_TIMEOUT" \
        --max-time "$CURL_MAX_TIME" \
        -o "$response_file" \
        -w "%{http_code}" \
        -X "$method" \
        "$API_URL$path" \
        "$@"); then
        RESPONSE_BODY="$(cat "$response_file" 2>/dev/null || true)"
        rm -f "$response_file"
        HTTP_CODE="${HTTP_CODE:-000}"
        return 0
    fi

    RESPONSE_BODY="$(cat "$response_file")"
    rm -f "$response_file"
}

secret_request() {
    local method="$1"
    local path="$2"
    shift 2

    request "$method" "$path" \
      -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
      -H "Cache-Control: no-store" \
      "$@"
}

is_success_code() {
    case "$1" in
        200|201|204)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

require_success() {
    local context="$1"

    if is_success_code "$HTTP_CODE"; then
        return 0
    fi

    echo "Error: $context failed with HTTP code $HTTP_CODE" >&2
    if [ -n "$RESPONSE_BODY" ]; then
        echo "Response: $RESPONSE_BODY" >&2
    fi
    exit 1
}

json_contains() {
    local body="$1"
    local text="$2"

    printf "%s" "$body" | jq -e --arg text "$text" '
      [.. | strings | select(contains($text))] | length > 0
    ' >/dev/null 2>&1
}

auth_payload() {
    jq -n -c \
      --arg login "$RBAC_SUBJECT_IDENTITY_EMAIL" \
      --arg password "$RBAC_SUBJECT_IDENTITY_PASSWORD" \
      '{ login: $login, password: $password }'
}

authenticate_subject() {
    local payload
    payload="$(auth_payload)"

    request "POST" "/api/rbac/subjects/authentication/email-and-password/authentication" \
      --form-string "data=$payload"

    AUTH_RESPONSE_BODY="$RESPONSE_BODY"
    AUTH_JWT_TOKEN=""
    AUTH_SUBJECT_ID=""

    if ! is_success_code "$HTTP_CODE"; then
        return 1
    fi

    AUTH_JWT_TOKEN="$(printf "%s" "$AUTH_RESPONSE_BODY" | jq -r '.data.jwt // empty')"

    if [ -z "$AUTH_JWT_TOKEN" ]; then
        echo "Error: Could not extract JWT token after authentication" >&2
        echo "Auth Response: $AUTH_RESPONSE_BODY" >&2
        exit 1
    fi

    request "GET" "/api/rbac/subjects/authentication/me" \
      -H "Authorization: Bearer $AUTH_JWT_TOKEN" \
      -H "Cache-Control: no-store"
    require_success "Fetching authenticated subject"

    AUTH_SUBJECT_ID="$(printf "%s" "$RESPONSE_BODY" | jq -r '.data.id // empty')"

    if [ -z "$AUTH_SUBJECT_ID" ]; then
        echo "Error: Could not extract subject ID after authentication" >&2
        echo "ME Response: $RESPONSE_BODY" >&2
        exit 1
    fi

    return 0
}

load_admin_role() {
    echo "Fetching RBAC admin role..."
    secret_request "GET" "/api/rbac/roles"
    require_success "Fetching RBAC roles"

    ADMIN_ROLE_ID="$(printf "%s" "$RESPONSE_BODY" | jq -r '
      first(.data[]? | select(.slug == "admin") | .id) // empty
    ')"

    if [ -z "$ADMIN_ROLE_ID" ]; then
        echo "Error: Could not find admin role ID" >&2
        echo "Roles response: $RESPONSE_BODY" >&2
        exit 1
    fi

    echo "Admin Role ID: $ADMIN_ROLE_ID"
}

load_identity() {
    local email
    email="$(printf "%s" "$RBAC_SUBJECT_IDENTITY_EMAIL" | tr '[:upper:]' '[:lower:]')"

    secret_request "GET" "/api/rbac/identities"
    require_success "Fetching RBAC identities"

    local identity_count
    identity_count="$(printf "%s" "$RESPONSE_BODY" | jq -r --arg email "$email" '
      [
        .data[]?
        | select((.email // "" | ascii_downcase) == $email)
        | select((.provider // "") == "email_and_password")
      ]
      | length
    ')"

    if [ "$identity_count" -gt 1 ]; then
        echo "Error: Multiple email_and_password identities found for $RBAC_SUBJECT_IDENTITY_EMAIL" >&2
        echo "This is ambiguous; cleanup duplicate identities before continuing." >&2
        exit 1
    fi

    IDENTITY_ID="$(printf "%s" "$RESPONSE_BODY" | jq -r --arg email "$email" '
      first(
        .data[]?
        | select((.email // "" | ascii_downcase) == $email)
        | select((.provider // "") == "email_and_password")
        | .id
      ) // empty
    ')"
}

create_subject_for_identity() {
    echo "Creating missing RBAC subject for existing identity..."

    local subject_payload
    subject_payload="$(jq -n -c '{ variant: "default" }')"

    secret_request "POST" "/api/rbac/subjects" \
      --form-string "data=$subject_payload"
    require_success "Creating RBAC subject"

    SUBJECT_ID="$(printf "%s" "$RESPONSE_BODY" | jq -r '.data.id // empty')"

    if [ -z "$SUBJECT_ID" ]; then
        echo "Error: Could not extract created subject ID" >&2
        echo "Subject response: $RESPONSE_BODY" >&2
        exit 1
    fi

    local relation_payload
    relation_payload="$(jq -n -c \
      --arg identityId "$IDENTITY_ID" \
      --arg subjectId "$SUBJECT_ID" \
      '{ identityId: $identityId, subjectId: $subjectId }')"

    secret_request "POST" "/api/rbac/subjects-to-identities/find-or-create" \
      --form-string "data=$relation_payload"
    require_success "Creating subject-to-identity relation"
}

load_subject_for_identity() {
    SUBJECT_ID=""

    secret_request "GET" "/api/rbac/subjects-to-identities"
    require_success "Fetching subjects-to-identities"

    SUBJECT_ID="$(printf "%s" "$RESPONSE_BODY" | jq -r --arg identityId "$IDENTITY_ID" '
      first(.data[]? | select(.identityId == $identityId) | .subjectId) // empty
    ')"
}

register_identity() {
    echo "No existing identity found. Registering RBAC subject..."

    local payload
    payload="$(auth_payload)"

    request "POST" "/api/rbac/subjects/authentication/email-and-password/registration" \
      --form-string "data=$payload"

    if is_success_code "$HTTP_CODE"; then
        return 0
    fi

    local registration_http_code
    local registration_response_body
    registration_http_code="$HTTP_CODE"
    registration_response_body="$RESPONSE_BODY"

    if json_contains "$RESPONSE_BODY" "Identity already exists"; then
        echo "Identity appeared during registration. Reusing existing identity..."
        return 0
    fi

    load_identity

    if [ -n "$IDENTITY_ID" ]; then
        echo "Registration did not complete cleanly, but identity now exists. Repairing RBAC links..."
        return 0
    fi

    echo "Error: Registration failed with HTTP code $registration_http_code" >&2
    if [ -n "$registration_response_body" ]; then
        echo "Response: $registration_response_body" >&2
    fi
    exit 1
}

ensure_identity_and_subject() {
    load_identity

    if [ -z "$IDENTITY_ID" ]; then
        register_identity
        load_identity
    fi

    if [ -z "$IDENTITY_ID" ]; then
        echo "Error: Could not find or create identity for $RBAC_SUBJECT_IDENTITY_EMAIL" >&2
        exit 1
    fi

    echo "Identity ID: $IDENTITY_ID"

    load_subject_for_identity

    if authenticate_subject; then
        SUBJECT_ID="$AUTH_SUBJECT_ID"
        echo "Authenticated subject ID: $SUBJECT_ID"
        return 0
    fi

    if json_contains "$AUTH_RESPONSE_BODY" "No authentications subjects associated"; then
        if [ -z "$SUBJECT_ID" ]; then
            create_subject_for_identity
        fi

        if authenticate_subject; then
            SUBJECT_ID="$AUTH_SUBJECT_ID"
            echo "Authenticated subject ID: $SUBJECT_ID"
            return 0
        fi
    fi

    echo "Error: Existing identity could not authenticate with the provided password." >&2
    echo "The script will not create another login for this email." >&2
    echo "Auth HTTP code: $HTTP_CODE" >&2
    if [ -n "$AUTH_RESPONSE_BODY" ]; then
        echo "Auth Response: $AUTH_RESPONSE_BODY" >&2
    fi
    exit 1
}

ensure_admin_role_for_subject() {
    echo "Ensuring admin role for subject: $SUBJECT_ID"

    secret_request "GET" "/api/rbac/subjects-to-roles"
    require_success "Fetching subjects-to-roles"

    local admin_relation_id
    admin_relation_id="$(printf "%s" "$RESPONSE_BODY" | jq -r \
      --arg subjectId "$SUBJECT_ID" \
      --arg adminRoleId "$ADMIN_ROLE_ID" '
      first(.data[]? | select(.subjectId == $subjectId and .roleId == $adminRoleId) | .id) // empty
    ')"

    if [ -n "$admin_relation_id" ]; then
        echo "Admin role is already assigned."
        return 0
    fi

    local existing_relation
    existing_relation="$(printf "%s" "$RESPONSE_BODY" | jq -c \
      --arg subjectId "$SUBJECT_ID" '
      first(.data[]? | select(.subjectId == $subjectId)) // empty
    ')"

    if [ -n "$existing_relation" ]; then
        local existing_relation_id
        local updated_relation
        existing_relation_id="$(printf "%s" "$existing_relation" | jq -r '.id')"
        updated_relation="$(printf "%s" "$existing_relation" | jq -c \
          --arg adminRoleId "$ADMIN_ROLE_ID" \
          '.roleId = $adminRoleId')"

        echo "Updating existing subject-to-role relation to admin: $existing_relation_id"
        secret_request "PATCH" "/api/rbac/subjects-to-roles/$existing_relation_id" \
          --form-string "data=$updated_relation"
        require_success "Updating subject-to-role relation"
        return 0
    fi

    local relation_payload
    relation_payload="$(jq -n -c \
      --arg subjectId "$SUBJECT_ID" \
      --arg roleId "$ADMIN_ROLE_ID" \
      '{ subjectId: $subjectId, roleId: $roleId }')"

    echo "Creating admin subject-to-role relation..."
    secret_request "POST" "/api/rbac/subjects-to-roles/find-or-create" \
      --form-string "data=$relation_payload"
    require_success "Creating admin subject-to-role relation"
}

verify_final_state() {
    echo "Verifying final authentication and admin role..."

    if ! authenticate_subject; then
        echo "Error: Final authentication failed with HTTP code $HTTP_CODE" >&2
        if [ -n "$AUTH_RESPONSE_BODY" ]; then
            echo "Auth Response: $AUTH_RESPONSE_BODY" >&2
        fi
        exit 1
    fi

    if [ "$AUTH_SUBJECT_ID" != "$SUBJECT_ID" ]; then
        echo "Error: Final authenticated subject does not match repaired subject" >&2
        echo "Expected subject ID: $SUBJECT_ID" >&2
        echo "Actual subject ID: $AUTH_SUBJECT_ID" >&2
        exit 1
    fi

    secret_request "GET" "/api/rbac/subjects-to-roles"
    require_success "Verifying subjects-to-roles"

    local has_admin_role
    has_admin_role="$(printf "%s" "$RESPONSE_BODY" | jq -r \
      --arg subjectId "$SUBJECT_ID" \
      --arg adminRoleId "$ADMIN_ROLE_ID" '
      any(.data[]?; .subjectId == $subjectId and .roleId == $adminRoleId)
    ')"

    if [ "$has_admin_role" != "true" ]; then
        echo "Error: Final admin role verification failed for subject $SUBJECT_ID" >&2
        exit 1
    fi
}

echo "Ensuring RBAC admin subject for email: $RBAC_SUBJECT_IDENTITY_EMAIL"
echo "API URL: $API_URL"

echo "Checking RBAC secret key..."
secret_request "GET" "/api/rbac/subjects/authentication/is-authorized"
require_success "RBAC secret preflight"

load_admin_role
ensure_identity_and_subject
ensure_admin_role_for_subject
verify_final_state

echo "OK: $RBAC_SUBJECT_IDENTITY_EMAIL has admin role on subject $SUBJECT_ID"
