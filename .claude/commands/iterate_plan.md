---
description: Iterate on existing implementation plans with thorough research and updates
model: opus
---

# Iterate Implementation Plan

You are tasked with updating existing implementation plans based on user feedback. You should be skeptical, thorough, and ensure changes are grounded in actual codebase reality.

## Initial Response

When this command is invoked:

1. **Parse input to identify**:

   - Issue ID (e.g., `142`)
   - Requested changes/feedback

2. **Find the most recent plan for this issue**:

   ```bash
   # Get repo name from context
   REPO_NAME=$(gh repo view --json name -q '.name')

   # Find the most recent plan for this issue
   find "thoughts/shared/plans/$REPO_NAME" -name "*ISSUE-${ISSUE_ID}*.md" -type f | sort -r | head -1
   ```

   If no plan found:

   ```
   No plan found for issue #ISSUE_NUMBER in thoughts/shared/plans/$REPO_NAME/

   Available plans:
   [list all plans in the directory]

   Please provide the exact plan file path, or create a plan first using /ralph_plan.
   ```

   If multiple plans exist, ask which one to update.

   If a plan is found, read it completely and proceed.

3. **Confirm the plan with user**:

   ```
   Found plan: [plan filename]

   Current approach: [brief summary from plan]
   Current phases: [list phases]

   What changes would you like to make?

   For example:
   - "Add a phase for migration handling"
   - "Update success criteria to include performance tests"
   - "Adjust scope to exclude feature X"
   - "Split Phase 2 into two separate phases"
   - "Fix typo in phase 3"
   ```

   Wait for user input.

## Process Steps

### Step 1: Read and Understand Current Plan

1. **Read the existing plan file COMPLETELY**:

   - Use Read tool WITHOUT limit/offset parameters
   - Understand the current structure, phases, and scope
   - Note the success criteria and implementation approach

2. **Understand the requested changes**:
   - Parse what the user wants to add/modify/remove
   - Identify if changes require codebase research
   - Determine the scope of the update

### Step 2: Research If Needed

**Only spawn research tasks if changes require new technical understanding.**

If the user's feedback requires understanding new code patterns or validating assumptions:

1. **Create a research todo list** using TodoWrite

2. **Spawn parallel sub-tasks for research**:

   Use the right agent for each type of research:

   **For code investigation:**

   - **codebase-locator** - To find relevant files
   - **codebase-analyzer** - To understand implementation details
   - **codebase-pattern-finder** - To find similar patterns

   **For historical context:**

   - **thoughts-locator** - To find related research or decisions
   - **thoughts-analyzer** - To extract insights from documents

   **Be EXTREMELY specific about directories**:

   - If the change involves "UI", specify `apps/host` directory
   - If it involves "API", specify `apps/api` directory
   - Include full path context in prompts

3. **Read any new files identified by research**:

   - Read them FULLY into the main context
   - Cross-reference with plan requirements

4. **Wait for ALL sub-tasks to complete** before proceeding

### Step 3: Present Understanding and Approach

Before making changes, confirm your understanding:

```
Based on your feedback, I understand you want to:
- [Change 1 with specific detail]
- [Change 2 with specific detail]

My research found:
- [Relevant code pattern or constraint]
- [Important discovery that affects the change]

I plan to update the plan by:
1. [Specific modification to make]
2. [Another modification]

Does this align with your intent?
```

Get user confirmation before proceeding.

### Step 4: Update the Plan

1. **Make focused, precise edits** to the existing plan:

   - Use Edit tool for surgical changes
   - Maintain the existing structure unless explicitly changing it
   - Keep all file:line references accurate
   - Update success criteria if needed

2. **Ensure consistency**:

   - If adding a new phase, ensure it follows the existing pattern
   - If modifying scope, update "What We're NOT Doing" section
   - If changing approach, update "Implementation Approach" section
   - Maintain the distinction between automated vs manual success criteria

3. **Preserve quality standards**:

   - Include specific file paths and line numbers for new content
   - Write measurable success criteria
   - Use `make` commands for automated verification
   - Keep language clear and actionable

### Step 5: Sync and Review

1. **Sync the updated plan**:

   - Run `humanlayer thoughts sync`
   - This ensures changes are properly indexed

2. **Present changes made**:

   ```
   I've updated the plan at `thoughts/shared/plans/$REPO_NAME/[filename].md`

   Changes made:
   - [Specific change 1]
   - [Specific change 2]

   The updated plan now:
   - [Key improvement]
   - [Another improvement]

   Would you like any further adjustments?
   ```

3. **Be ready to iterate further** based on feedback

## Important Guidelines

1. **Be Skeptical**:

   - Don't blindly accept change requests that seem problematic
   - Question vague feedback - ask for clarification
   - Verify technical feasibility with code research
   - Point out potential conflicts with existing plan phases

2. **Be Surgical**:

   - Make precise edits, not wholesale rewrites
   - Preserve good content that doesn't need changing
   - Only research what's necessary for specific changes
   - Don't over-engineer updates

3. **Be Thorough**:

   - Read the entire existing plan before making changes
   - Research code patterns if changes require new technical understanding
   - Ensure updated sections maintain quality standards
   - Verify success criteria are still measurable

4. **Be Interactive**:

   - Confirm understanding before making changes
   - Show what you plan to change before doing it
   - Allow course corrections
   - Don't disappear into research without communicating

5. **Track Progress**:

   - Use TodoWrite to track update tasks if complex
   - Update todos as you complete research
   - Mark tasks complete when done

6. **No Open Questions**:

   - If a requested change raises questions, ASK
   - Research or get clarification immediately
   - Do NOT update the plan with unresolved questions
   - Every change must be complete and actionable

## Success Criteria Guidelines

When updating success criteria, always maintain the two-category structure:

1. **Automated Verification** (can be run by execution agents):

   - Commands that can be run: `make test`, `npm run lint`, etc.
   - Prefer `make` commands: `make -C apps/api check` instead of `cd apps/api && bun run fmt`
   - Specific files that should exist
   - Code compilation/type checking

2. **Manual Verification** (requires human testing):

   - UI/UX functionality
   - Performance under real conditions
   - Edge cases that are hard to automate
   - User acceptance criteria

## Example Interaction Flows

**Scenario 1: User provides issue ID and changes**

```
User: /iterate_plan 142 - add phase for error handling
Assistant: [Finds plan for issue 142, researches error handling patterns, updates plan]
```

**Scenario 2: User provides just issue ID**

```
User: /iterate_plan 142
Assistant: Found plan: 2026-02-28-ISSUE-0142-admin-panel-v2-migration.md

Current approach: Pilot stabilization with architecture cleanup
Current phases: 3 phases

What changes would you like to make?

User: Add more specific success criteria
Assistant: [Proceeds with update]
```

**Scenario 3: User provides no arguments**

```
User: /iterate_plan
Assistant: Which issue would you like to update? Please provide issue ID (e.g., `142`).

Tip: List recent plans with `find thoughts/shared/plans/$(gh repo view --json name -q '.name') -name "ISSUE-*.md" | sort -r | head`

User: 142
Assistant: [Finds plan and asks for changes]
```
