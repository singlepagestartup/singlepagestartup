#!/bin/bash
set -e

echo "==> Setting up AI agent environment"

# ── 1. Required tools ────────────────────────────────────────────────────────

install_brew_package() {
  local pkg=$1
  if ! command -v "$pkg" &>/dev/null; then
    echo "    Installing $pkg..."
    if command -v brew &>/dev/null; then
      brew install "$pkg"
    elif command -v apt-get &>/dev/null; then
      sudo apt-get install -y "$pkg"
    else
      echo "    ERROR: Cannot install $pkg — install it manually and re-run ai.sh"
      exit 1
    fi
  else
    echo "    $pkg: ok"
  fi
}

echo "--> Checking required tools"
install_brew_package jq
install_brew_package gh

# ── 2. gh authentication ─────────────────────────────────────────────────────

echo "--> Checking gh authentication"
if ! gh auth status &>/dev/null; then
  echo "    gh is not authenticated. Launching login..."
  if ! gh auth login --scopes "repo,read:org,read:project"; then
    echo ""
    echo "    Authentication failed or timed out."
    echo "    Run manually in your terminal: gh auth login"
    echo "    Then re-run: ./ai.sh"
    exit 1
  fi
else
  echo "    gh auth: ok ($(gh api user -q '.login'))"
fi

echo "--> Checking gh token scopes"
if ! gh api graphql -f query='query { viewer { login } }' &>/dev/null; then
  echo "    Token invalid. Run: gh auth login"
  exit 1
fi
# Verify read:project by making a projects API call
if ! gh api graphql -f query='query { viewer { projectsV2(first: 1) { nodes { id } } } }' &>/dev/null; then
  echo "    Token is missing project scope. Refreshing..."
  if ! gh auth refresh --hostname github.com -s read:project,project; then
    echo ""
    echo "    Scope refresh failed or timed out."
    echo "    Run manually: gh auth refresh -s read:project,project"
    echo "    Then re-run: ./ai.sh"
    exit 1
  fi
  echo "    Scopes updated"
else
  echo "    Token scopes: ok"
fi

# ── 3. Claude .env setup ─────────────────────────────────────────────────────

echo "--> Checking .claude/.env"
if [ ! -f .claude/.env ]; then
  cp .claude/.env.example .claude/.env
  echo "    Created .claude/.env from .env.example"
fi

source .claude/.env

if [ -z "$GITHUB_PROJECT_NUMBER" ]; then
  echo ""
  echo "    GITHUB_PROJECT_NUMBER is not set in .claude/.env"
  echo "    Available projects:"
  echo ""
  gh project list --me 2>/dev/null || true
  echo ""
  read -rp "    Enter your GitHub Project number: " project_number
  sed -i '' "s/GITHUB_PROJECT_NUMBER=/GITHUB_PROJECT_NUMBER=$project_number/" .claude/.env
  source .claude/.env
  echo "    Saved GITHUB_PROJECT_NUMBER=$project_number"
fi

if [ -z "$GITHUB_PROJECT_OWNER" ]; then
  DETECTED_OWNER=$(gh repo view --json owner -q '.owner.login' 2>/dev/null || echo "")
  if [ -n "$DETECTED_OWNER" ]; then
    echo "    GITHUB_PROJECT_OWNER not set — using repo owner: $DETECTED_OWNER"
  fi
fi

# ── 4. Validate project access ───────────────────────────────────────────────

echo "--> Validating GitHub Project access"

source .claude/.env
PROJECT_OWNER="${GITHUB_PROJECT_OWNER:-$(gh repo view --json owner -q '.owner.login' 2>/dev/null)}"
PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"

if [ "$PROJECT_OWNER_TYPE" = "organization" ]; then
  QUERY='query($login: String!, $number: Int!) { organization(login: $login) { projectV2(number: $number) { title url } } }'
  RESULT=$(gh api graphql -f query="$QUERY" -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER" 2>&1)
  PROJECT_TITLE=$(echo "$RESULT" | jq -r '.data.organization.projectV2.title // empty')
  PROJECT_URL=$(echo "$RESULT"   | jq -r '.data.organization.projectV2.url   // empty')
else
  QUERY='query($login: String!, $number: Int!) { user(login: $login) { projectV2(number: $number) { title url } } }'
  RESULT=$(gh api graphql -f query="$QUERY" -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER" 2>&1)
  PROJECT_TITLE=$(echo "$RESULT" | jq -r '.data.user.projectV2.title // empty')
  PROJECT_URL=$(echo "$RESULT"   | jq -r '.data.user.projectV2.url   // empty')
fi

if [ -z "$PROJECT_TITLE" ]; then
  echo "    ERROR: Cannot access project #$GITHUB_PROJECT_NUMBER for $PROJECT_OWNER"
  echo "    Check GITHUB_PROJECT_NUMBER, GITHUB_PROJECT_OWNER, and GITHUB_PROJECT_OWNER_TYPE in .claude/.env"
  exit 1
fi

echo "    Connected: \"$PROJECT_TITLE\" → $PROJECT_URL"

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "✅ AI agent environment ready"
echo ""
echo "   Project : $PROJECT_TITLE"
echo "   URL     : $PROJECT_URL"
echo "   Config  : .claude/.env"
echo ""
echo "   Available commands:"
echo "     /github             — manage issues"
echo "     /ralph_research     — research highest priority issue"
echo "     /ralph_plan         — write implementation plan"
echo "     /ralph_impl         — implement issue"
echo "     /setup_github_project — configure project statuses and labels"
