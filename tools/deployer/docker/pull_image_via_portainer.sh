#!/usr/bin/env bash

set -euo pipefail

required_values=(
  DOMAIN
  PORTAINER_SERVICE_SUBDOMAIN
  PORTAINER_USERNAME
  PORTAINER_PASSWORD
  DOCKER_HUB_URL
  IMAGE_TAG
)

for name in "${required_values[@]}"; do
  if [ -z "${!name:-}" ]; then
    echo "Required deployment value $name is empty"
    exit 1
  fi
done

docker_hub_login_username="${DOCKER_HUB_LOGIN_USERNAME:-${DOCKER_HUB_USERNAME:-}}"
if [ -z "$docker_hub_login_username" ]; then
  echo "Docker Hub login username is empty"
  exit 1
fi

portainer_url="https://${PORTAINER_SERVICE_SUBDOMAIN}.${DOMAIN}"
portainer_endpoint_id="${PORTAINER_ENDPOINT_ID:-1}"
pull_retry_base_delay_seconds="${SPS_PULL_RETRY_BASE_DELAY_SECONDS:-15}"
auth_payload="$(jq -n \
  --arg username "$PORTAINER_USERNAME" \
  --arg password "$PORTAINER_PASSWORD" \
  '{username: $username, password: $password}')"
portainer_jwt="$(curl \
  --fail-with-body \
  --silent \
  --show-error \
  --request POST \
  --header 'Content-Type: application/json' \
  --data "$auth_payload" \
  "$portainer_url/api/auth" | jq -r '.jwt // empty')"

if [ -z "$portainer_jwt" ]; then
  echo "Portainer authentication did not return a JWT"
  exit 1
fi

registries="$(curl \
  --fail-with-body \
  --silent \
  --show-error \
  --header "Authorization: Bearer $portainer_jwt" \
  "$portainer_url/api/registries")"
registry_id="$(jq -r \
  --arg name "dockerhub-$docker_hub_login_username" \
  --arg url "$DOCKER_HUB_URL" \
  '[.[] | select(.Name == $name or .URL == $url)][0].Id // empty' \
  <<< "$registries")"

if [ -z "$registry_id" ]; then
  echo "Configured Docker Hub registry was not found in Portainer"
  exit 1
fi

registry_auth="$(printf '{"registryId":%s}' "$registry_id" | base64 | tr -d '\n')"

prune_docker_objects() {
  local mode="$1"
  local container_filters='{}'
  local image_filters='{"dangling":["true"]}'

  if [ "$mode" = "aged" ]; then
    image_filters='{"dangling":["false"],"until":["24h"]}'
  elif [ "$mode" = "aggressive" ]; then
    image_filters='{"dangling":["false"]}'
  fi

  echo "Freeing Docker space before retry ($mode cleanup)"

  local container_prune_response
  if container_prune_response="$(curl \
    --fail-with-body \
    --silent \
    --show-error \
    --request POST \
    --get \
    --header "Authorization: Bearer $portainer_jwt" \
    --data-urlencode "filters=$container_filters" \
    "$portainer_url/api/endpoints/$portainer_endpoint_id/docker/containers/prune")"; then
    echo "Container cleanup reclaimed $(jq -r '.SpaceReclaimed // 0' <<< "$container_prune_response") bytes"
  else
    echo "Container cleanup failed; pull retry will continue" >&2
  fi

  local image_prune_response
  if image_prune_response="$(curl \
    --fail-with-body \
    --silent \
    --show-error \
    --request POST \
    --get \
    --header "Authorization: Bearer $portainer_jwt" \
    --data-urlencode "filters=$image_filters" \
    "$portainer_url/api/endpoints/$portainer_endpoint_id/docker/images/prune")"; then
    echo "Image cleanup reclaimed $(jq -r '.SpaceReclaimed // 0' <<< "$image_prune_response") bytes"
  else
    echo "Image cleanup failed; pull retry will continue" >&2
  fi
}

pull_image_once() {
  local image_repository="$1"
  local response_file="$2"
  local curl_status=0
  local pull_errors

  : > "$response_file"
  curl \
    --fail-with-body \
    --silent \
    --show-error \
    --request POST \
    --get \
    --header "Authorization: Bearer $portainer_jwt" \
    --header "X-Registry-Auth: $registry_auth" \
    --data-urlencode "fromImage=$image_repository" \
    --data-urlencode "tag=$IMAGE_TAG" \
    "$portainer_url/api/endpoints/$portainer_endpoint_id/docker/images/create" \
    > "$response_file" || curl_status=$?

  pull_errors="$(jq -rs \
    '[.[] | (.error // .errorDetail.message // empty)] | map(select(length > 0)) | unique | join("\n")' \
    "$response_file" 2> /dev/null || true)"

  if [ "$curl_status" -eq 0 ] && [ -z "$pull_errors" ]; then
    jq -r 'select(.status? != null) | .status' "$response_file" | tail -n 1
    return 0
  fi

  if [ -n "$pull_errors" ]; then
    printf '%s\n' "$pull_errors" >&2
  else
    cat "$response_file" >&2
  fi

  return 1
}

repositories=(
  "${HOST_REPOSITORY:-}"
  "${API_REPOSITORY:-}"
  "${LLM_REPOSITORY:-}"
  "${MCP_REPOSITORY:-}"
  "${TELEGRAM_REPOSITORY:-}"
)
unique_repositories=()

for repository in "${repositories[@]}"; do
  if [ -z "$repository" ]; then
    continue
  fi

  duplicate=false
  for existing_repository in "${unique_repositories[@]-}"; do
    if [ "$existing_repository" = "$repository" ]; then
      duplicate=true
      break
    fi
  done

  if [ "$duplicate" = "false" ]; then
    unique_repositories+=("$repository")
  fi
done

if [ "${#unique_repositories[@]}" -eq 0 ]; then
  echo "No Docker repositories are configured for deployment"
  exit 1
fi

# Failed Swarm tasks and interrupted pulls can leave safe-to-remove objects.
# Remove only stopped containers and dangling images before the first attempt.
prune_docker_objects conservative

for repository in "${unique_repositories[@]}"; do
  image_repository="${DOCKER_HUB_URL}/${repository}"
  response_file="$(mktemp)"
  pulled=false

  for attempt in 1 2 3; do
    echo "Pulling ${image_repository}:${IMAGE_TAG} before updating services (attempt $attempt/3)"

    if pull_image_once "$image_repository" "$response_file"; then
      pulled=true
      break
    fi

    if grep -qi "no space left on device" "$response_file"; then
      if [ "$attempt" -eq 1 ]; then
        prune_docker_objects aged
      else
        # Running containers and their images are never removed. At this point
        # rollback images can be downloaded again, while a full disk cannot
        # complete the current release at all.
        prune_docker_objects aggressive
      fi
    fi

    if [ "$attempt" -lt 3 ]; then
      sleep $((attempt * pull_retry_base_delay_seconds))
    fi
  done

  rm -f "$response_file"

  if [ "$pulled" != "true" ]; then
    echo "Unable to pull ${image_repository}:${IMAGE_TAG} after 3 attempts" >&2
    exit 1
  fi
done
