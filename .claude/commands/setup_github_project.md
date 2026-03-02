---
description: Create and configure a GitHub Project with required statuses and labels for the SPS workflow
---

## Setup GitHub Project for SPS Workflow

### Step 1 — Detect context

```bash
GITHUB_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
GITHUB_LOGIN=$(gh repo view --json owner -q '.owner.login')
source .claude/.env

# Determine project owner and entity type
PROJECT_OWNER="${GITHUB_PROJECT_OWNER:-$GITHUB_LOGIN}"
PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"
```

### Step 2 — Create or use existing project

If `GITHUB_PROJECT_NUMBER` is already set in `.claude/.env`, skip to Step 3.

Otherwise, create a new project:

```bash
PROJECT_URL=$(gh project create --owner "$PROJECT_OWNER" --title "$(gh repo view --json name -q '.name') Board" --format json | jq -r '.url')
GITHUB_PROJECT_NUMBER=$(echo "$PROJECT_URL" | grep -o '[0-9]*$')
echo "Created project #$GITHUB_PROJECT_NUMBER: $PROJECT_URL"
```

Save the number to `.claude/.env`:

```bash
sed -i '' "s/GITHUB_PROJECT_NUMBER=/GITHUB_PROJECT_NUMBER=$GITHUB_PROJECT_NUMBER/" .claude/.env
```

### Step 3 — Fetch the project node ID and Status field ID

```bash
# Use organization(...) or user(...) depending on PROJECT_OWNER_TYPE
if [ "$PROJECT_OWNER_TYPE" = "organization" ]; then
  PROJECT_DATA=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      organization(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }
  ' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER")
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.organization.projectV2.id')
  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '[.data.organization.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].id')
else
  PROJECT_DATA=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }
  ' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER")
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.id')
  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '[.data.user.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].id')
fi

echo "Project node ID: $PROJECT_NODE_ID"
echo "Status field ID: $STATUS_FIELD_ID"
```

If `STATUS_FIELD_ID` is `null` or empty, the project has no "Status" field yet — create one:

```bash
NEW_FIELD=$(gh api graphql -f query='
  mutation($projectId: ID!) {
    createProjectV2Field(input: {
      projectId: $projectId
      dataType: SINGLE_SELECT
      name: "Status"
    }) {
      projectV2Field {
        ... on ProjectV2SingleSelectField { id }
      }
    }
  }
' -f projectId="$PROJECT_NODE_ID")

STATUS_FIELD_ID=$(echo "$NEW_FIELD" | jq -r '.data.createProjectV2Field.projectV2Field.id')
```

### Step 4 — Set all required status options

First, check which of the 12 required statuses are already present:

```bash
REQUIRED_STATUSES="Triage Spec\ Needed Research\ Needed Research\ in\ Progress Research\ in\ Review Ready\ for\ Plan Plan\ in\ Progress Plan\ in\ Review Ready\ for\ Dev In\ Dev Code\ Review Done"

EXISTING_NAMES=$(echo "$PROJECT_DATA" | jq -r '[.data.organization.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].options[].name')

echo "Existing statuses:"
echo "$EXISTING_NAMES"
```

Compare against the required list. If all 12 are present — skip this step and inform the user.

If any are missing (or the existing set is different, e.g. default `Todo` / `In Progress`):

1. **Warn the user**: `updateProjectV2Field` replaces ALL options at once — existing tasks that have statuses not in the new set will have their status reset to `null`.
2. Ask for confirmation before proceeding.
3. Only after confirmation, run the mutation:

```bash
gh api graphql -f query='
  mutation($projectId: ID!, $fieldId: ID!) {
    updateProjectV2Field(input: {
      projectId: $projectId
      fieldId: $fieldId
      singleSelectOptions: [
        { name: "Triage",               color: GRAY,   description: "Newly created — needs initial review and categorization" }
        { name: "Spec Needed",          color: YELLOW, description: "Problem or solution unclear — more detail required before research" }
        { name: "Research Needed",      color: ORANGE, description: "Needs investigation before a plan can be written" }
        { name: "Research in Progress", color: ORANGE, description: "Active research underway" }
        { name: "Research in Review",   color: BLUE,   description: "Research findings complete, awaiting review" }
        { name: "Ready for Plan",       color: GREEN,  description: "Research approved, needs an implementation plan" }
        { name: "Plan in Progress",     color: GREEN,  description: "Actively writing the implementation plan" }
        { name: "Plan in Review",       color: BLUE,   description: "Plan written, awaiting approval" }
        { name: "Ready for Dev",        color: PURPLE, description: "Plan approved, ready for implementation" }
        { name: "In Dev",               color: PURPLE, description: "Active development" }
        { name: "Code Review",          color: PINK,   description: "PR submitted" }
        { name: "Done",                 color: GREEN,  description: "Completed" }
      ]
    }) {
      projectV2Field {
        ... on ProjectV2SingleSelectField {
          options { id name color }
        }
      }
    }
  }
' -f projectId="$PROJECT_NODE_ID" -f fieldId="$STATUS_FIELD_ID"
```

### Step 4b — Create Issue Type field

Check if an "Issue Type" single-select field already exists. If not, create it:

```bash
gh api graphql -f query='
  mutation($projectId: ID!) {
    createProjectV2Field(input: {
      projectId: $projectId
      dataType: SINGLE_SELECT
      name: "Issue Type"
      singleSelectOptions: [
        { name: "Feature",     color: BLUE,   description: "New functionality or enhancement" }
        { name: "Bug",         color: RED,    description: "Something is broken" }
        { name: "Refactoring", color: GRAY,   description: "Code improvement without behavior change" }
        { name: "Research",    color: YELLOW, description: "Investigation or discovery task" }
      ]
    }) {
      projectV2Field {
        ... on ProjectV2SingleSelectField { id name options { name } }
      }
    }
  }
' -f projectId="$PROJECT_NODE_ID"
```

> Note: "Type" is a reserved name in GitHub Projects — use "Issue Type" instead.

### Step 5 — Clean up and create issue labels

First, remove all labels that don't follow the `size:*` or `area:*` convention:

```bash
gh label list --json name | jq -r '.[].name' | while read label; do
  if [[ "$label" != size:* && "$label" != area:* ]]; then
    gh label delete "$label" --yes
    echo "  Deleted: $label"
  fi
done
```

Then create the required labels:

```bash
# Size labels
gh label create "size:xs"     --color "0E8A16" --description "Trivial change, under an hour"  --force
gh label create "size:small"  --color "5319E7" --description "A few hours"                    --force
gh label create "size:medium" --color "FBCA04" --description "1–2 days"                       --force
gh label create "size:large"  --color "D93F0B" --description "Multiple days or more"          --force

# Area labels — generated from the apps/ directory
for app in $(ls apps/ | grep -v .DS_Store); do
  gh label create "area:$app" --color "1D76DB" --description "Changes in apps/$app" --force
  echo "  Created: area:$app"
done
```

### Step 6 — Verify

```bash
echo "✅ GitHub Project configured"
if [ "$PROJECT_OWNER_TYPE" = "organization" ]; then
  echo "Project URL: https://github.com/orgs/$PROJECT_OWNER/projects/$GITHUB_PROJECT_NUMBER"
  echo ""
  echo "Status options set:"
  echo "$PROJECT_DATA" | jq -r '[.data.organization.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].options[].name'
else
  echo "Project URL: https://github.com/users/$PROJECT_OWNER/projects/$GITHUB_PROJECT_NUMBER"
  echo ""
  echo "Status options set:"
  echo "$PROJECT_DATA" | jq -r '[.data.user.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].options[].name'
fi
```

### Done

Print a summary for the user:

```
✅ GitHub Project setup complete

Project #GITHUB_PROJECT_NUMBER created and configured with:
- 12 workflow statuses (Triage → Done)
- 4 size labels (size:xs, size:small, size:medium, size:large)
- area labels for each app in apps/ (area:api, area:host, area:db, ...)

Next: set GITHUB_PROJECT_NUMBER=N in .claude/.env (if not already done)

View project: https://github.com/orgs/GITHUB_PROJECT_OWNER/projects/GITHUB_PROJECT_NUMBER
```
