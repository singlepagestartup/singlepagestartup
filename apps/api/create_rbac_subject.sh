#!/bin/bash
. ../../tools/deployer/get_env.sh

set -euo pipefail

API_URL='http://localhost:4000'

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

echo "Creating RBAC subject with email: $RBAC_SUBJECT_IDENTITY_EMAIL"

curl -v -X POST "$API_URL/api/rbac/subjects/authentication/email-and-password/registration" \
  -F "data={\"login\":\"$RBAC_SUBJECT_IDENTITY_EMAIL\",\"password\":\"$RBAC_SUBJECT_IDENTITY_PASSWORD\"}"

echo "Authenticating subject..."

AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/rbac/subjects/authentication/email-and-password/authentication" \
  -F "data={\"login\":\"$RBAC_SUBJECT_IDENTITY_EMAIL\",\"password\":\"$RBAC_SUBJECT_IDENTITY_PASSWORD\"}")

if command -v jq &> /dev/null; then
    JWT_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.jwt')
else
    JWT_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"jwt":"[^"]*"' | sed 's/"jwt":"//;s/"//')
fi

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
    echo "Error: Could not extract JWT token" >&2
    echo "Auth Response: $AUTH_RESPONSE" >&2
    exit 1
fi

echo "JWT token extracted successfully"

echo "Fetching subject information..."
ME_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/subjects/authentication/me" \
  -H "Authorization: Bearer $JWT_TOKEN")

if command -v jq &> /dev/null; then
    SUBJECT_ID=$(echo "$ME_RESPONSE" | jq -r '.data.id')
else
    SUBJECT_ID=$(echo "$ME_RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
fi

if [ -z "$SUBJECT_ID" ] || [ "$SUBJECT_ID" = "null" ]; then
    echo "Error: Could not extract subject ID" >&2
    echo "ME Response: $ME_RESPONSE" >&2
    exit 1
fi

echo "Subject ID: $SUBJECT_ID"

echo "Fetching subjects-to-roles..."
SUBJECT_TO_ROLES_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/subjects-to-roles")

if command -v jq &> /dev/null; then
    SUBJECT_TO_ROLE_ID=$(echo "$SUBJECT_TO_ROLES_RESPONSE" | jq -r ".data[] | select(.subjectId == \"$SUBJECT_ID\") | .id")
    CURRENT_ROLE_ID=$(echo "$SUBJECT_TO_ROLES_RESPONSE" | jq -r ".data[] | select(.subjectId == \"$SUBJECT_ID\") | .roleId")
    SUBJECT_TO_ROLE_OBJECT=$(echo "$SUBJECT_TO_ROLES_RESPONSE" | jq -r ".data[] | select(.subjectId == \"$SUBJECT_ID\")")
else
    SUBJECT_TO_ROLE_OBJECT=$(echo "$SUBJECT_TO_ROLES_RESPONSE" | grep -o "{[^}]*\"subjectId\":\"$SUBJECT_ID\"[^}]*}")
    SUBJECT_TO_ROLE_ID=$(echo "$SUBJECT_TO_ROLE_OBJECT" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
    CURRENT_ROLE_ID=$(echo "$SUBJECT_TO_ROLE_OBJECT" | grep -o '"roleId":"[^"]*"' | sed 's/"roleId":"//;s/"//')
fi

if [ -z "$SUBJECT_TO_ROLE_ID" ] || [ "$SUBJECT_TO_ROLE_ID" = "null" ]; then
    echo "Error: Could not find subject-to-role ID for subject ID: $SUBJECT_ID" >&2
    echo "Subjects-to-roles response: $SUBJECT_TO_ROLES_RESPONSE" >&2
    exit 1
fi

echo "Subject-to-role ID: $SUBJECT_TO_ROLE_ID"
echo "Current Role ID: $CURRENT_ROLE_ID"

echo "Fetching RBAC roles..."
ROLES_RESPONSE=$(curl -s -X GET "$API_URL/api/rbac/roles")

if command -v jq &> /dev/null; then
    ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | jq -r '.data[] | select(.slug == "admin") | .id')
else
    ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -o '"slug":"admin"[^}]*' | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
fi

if [ -z "$ADMIN_ROLE_ID" ] || [ "$ADMIN_ROLE_ID" = "null" ]; then
    echo "Error: Could not find admin role ID" >&2
    echo "Roles response: $ROLES_RESPONSE" >&2
    exit 1
fi

echo "Admin Role ID: $ADMIN_ROLE_ID"

echo "Updating subject-to-role to assign admin role..."

if command -v jq &> /dev/null; then
    UPDATED_SUBJECT_TO_ROLE=$(echo "$SUBJECT_TO_ROLE_OBJECT" | jq ".roleId = \"$ADMIN_ROLE_ID\"")
else
    UPDATED_SUBJECT_TO_ROLE=$(echo "$SUBJECT_TO_ROLE_OBJECT" | sed "s/\"roleId\":\"[^\"]*\"/\"roleId\":\"$ADMIN_ROLE_ID\"/")
fi

UPDATE_RESPONSE=$(curl -s -w "%{http_code}" -X PATCH "$API_URL/api/rbac/subjects-to-roles/$SUBJECT_TO_ROLE_ID" \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -F "data=$UPDATED_SUBJECT_TO_ROLE")

HTTP_CODE="${UPDATE_RESPONSE: -3}"
RESPONSE_BODY="${UPDATE_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "OK"
else
    echo "Error: Update failed with HTTP code $HTTP_CODE" >&2
    echo "Response: $RESPONSE_BODY" >&2
    exit 1
fi
