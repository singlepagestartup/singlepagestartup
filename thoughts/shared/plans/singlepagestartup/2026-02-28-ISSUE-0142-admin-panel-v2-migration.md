# Admin Panel v2 Migration Implementation Plan

## Overview

Migrate the admin panel from v1 to v2 for a unified admin experience. This plan focuses on stabilizing the pilot implementation for `ecommerce.product`, `ecommerce.attribute`, and `ecommerce.products-to-attributes` before scaling to other modules.

**Goal:** Fix 8 identified structural issues in the pilot, then use the clean pattern as a template for rolling out admin-v2 to remaining modules.

## Current State Analysis

### What Exists

- **Admin-v2 shell** at `/admin/**` with product, attribute, and products-to-attributes wired up
- **Core flows** (list, create, edit, delete) implemented via URL-based routing + variant dispatch pattern
- **Component structure:**
  - `apps/host/src/components/admin-panel-draft/` - Main admin-v2 wrapper
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/` - Module-level admin-v2
  - `libs/modules/ecommerce/models/*/frontend/component/src/lib/singlepage/admin-v2/` - Model-specific components
  - `libs/modules/ecommerce/relations/*/frontend/component/src/lib/singlepage/admin-v2/` - Relation components

### Key Issues Identified

1. **Route parsing logic is duplicated in 5 places:**

   - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx:22-32`
   - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx:11-21`
   - `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:63-73`
   - `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx:113-123`
   - `apps/host/src/components/admin-panel-draft/utils.tsx:199-230`

2. **Sidebar re-instantiation bug:**

   - `apps/host/src/components/admin-panel-draft/ClientComponent.tsx:21-31` renders `EcommerceAdminV2Component` three times
   - This causes sidebar state to reset on navigation

3. **No RBAC gating:**

   - Admin-v1 had role checking; admin-v2 has none
   - Any user can access `/admin/**`

4. **Account settings uses hardcoded mock data:**

   - `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts` contains mock data
   - Not wired to live SDK calls

5. **`utils.tsx` state machine appears unused:**

   - Full client-side state machine in `utils.tsx` is not called by `ClientComponent.tsx`

6. **Inconsistent relation rendering styles:**

   - Product form uses Details/Relations tabs
   - Attribute form uses inline sections

7. **`select-input` delegates to admin-v1:**
   - `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx:2`
   - `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx:2`
   - Both import from `@sps/shared-frontend-components/singlepage/admin/select-input/Component`

## Desired End State

### Success Criteria

1. **Route parsing consolidated:** Single shared utility for admin route parsing
2. **Sidebar state preserved:** Sidebar maintains state across navigation
3. **RBAC gating:** Only users with admin role can access admin panel
4. **Live data:** Account settings displays real data from SDK
5. **Clean architecture:** No dead code, consistent patterns
6. **Unified relation rendering:** Standardized approach across all forms
7. **Self-contained v2:** No cross-version dependencies to admin-v1

### Pilot Validation Criteria

- [ ] CRUD operations work for all 3 entities (product, attribute, products-to-attributes)
- [ ] No console errors in admin panel
- [ ] Sidebar state persists across navigation
- [ ] Non-admin users are redirected from `/admin/**`
- [ ] Account settings shows live data

## What We're NOT Doing

- Migrating modules outside the pilot scope (blog, crm, social, etc.)
- Implementing new admin features beyond what exists in v1
- Modifying the core admin-v1 implementation
- Changing the URL routing structure beyond consolidation

## Implementation Approach

**Strategy:** Fix structural issues first, then use the clean pattern as a template for module rollout.

**Phasing:**

1. Extract shared utilities and consolidate duplicated code
2. Fix sidebar re-instantiation bug
3. Add RBAC gating
4. Standardize relation rendering and remove cross-version dependencies
5. Wire live data for account settings
6. Clean up dead code

## Phase 1: Consolidate Route Parsing

### Overview

Extract duplicated route parsing logic into a shared utility to eliminate code duplication across 5 locations.

### Changes Required

#### 1. Create shared route parsing utility

**File:** `libs/shared/frontend/client-utils/src/lib/admin-route.ts`
**Changes:** New file containing shared route parsing logic

```typescript
import { useMemo } from "react";

export function getAdminRoutePath(pathname: string | null): string {
  const value = pathname || "";
  const adminIndex = value.indexOf("/admin");

  if (adminIndex === -1) {
    return "/";
  }

  const next = value.slice(adminIndex + "/admin".length) || "/";
  return next.replace(/\/+$/, "") || "/";
}

export function useAdminRoutePath(pathname: string | null) {
  return useMemo(() => getAdminRoutePath(pathname), [pathname]);
}

export function parseAdminRoute(path: string): {
  module: string | null;
  model: string | null;
} {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const routeMatch = normalized.match(/^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/);

  return {
    module: routeMatch?.[1] || null,
    model: routeMatch?.[2] || null,
  };
}

export function useAdminRoute(pathname: string | null) {
  const currentPath = useAdminRoutePath(pathname);
  const route = useMemo(() => parseAdminRoute(currentPath), [currentPath]);
  return { currentPath, ...route };
}

export function getAdminBasePath(pathname: string): string {
  const adminIndex = pathname.indexOf("/admin");

  if (adminIndex === -1) {
    return "/admin";
  }

  return pathname.slice(0, adminIndex + "/admin".length);
}

export function useAdminBasePath(pathname: string) {
  return useMemo(() => getAdminBasePath(pathname), [pathname]);
}
```

#### 2. Update ecommerce admin-v2 ClientComponent

**File:** `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx`
**Changes:** Replace local `getAdminRoutePath` and route parsing with shared utility

```typescript
// Remove lines 22-32 (getAdminRoutePath function)
// Add import: import { useAdminRoute, useAdminBasePath } from "@sps/shared-frontend-client-utils/admin-route";
```

#### 3. Update sidebar-module-item ClientComponent

**File:** `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx`
**Changes:** Replace local `getAdminRoutePath` with shared utility

```typescript
// Remove lines 11-21 (getAdminRoutePath function)
// Add imports from shared utility
```

#### 4. Update settings-page ClientComponent

**File:** `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx`
**Changes:** Replace local `getAdminRoutePath` with shared utility

```typescript
// Remove lines 63-73 (getAdminRoutePath function)
// Add imports from shared utility
```

#### 5. Update account-settings-page ClientComponent

**File:** `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx`
**Changes:** Replace local `getAdminRoutePath` with shared utility

```typescript
// Remove lines 113-123 (getAdminRoutePath function)
// Add imports from shared utility
```

#### 6. Remove unused utils.tsx state machine

**File:** `apps/host/src/components/admin-panel-draft/utils.tsx`
**Changes:** Remove or refactor; only keep `applyRoute` if still needed elsewhere

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] No broken imports: `nx run host:build`

#### Manual Verification:

- [ ] Navigation still works: `/admin/modules/ecommerce/models/product`
- [ ] Settings page still renders correctly
- [ ] Account settings page still renders correctly
- [ ] Sidebar navigation functions properly

**Implementation Note:** After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Fix Sidebar Re-instantiation Bug

### Overview

Refactor `ClientComponent.tsx` to render `EcommerceAdminV2Component` only once, preserving sidebar state across navigation.

### Changes Required

#### 1. Refactor ClientComponent to use children pattern

**File:** `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`
**Changes:** Restructure to avoid multiple component instances

```typescript
"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { SettingsPageClientComponent } from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { IAdminPanelDraftProps } from "./interface";
import { useAdminRoute } from "@sps/shared-frontend-client-utils/admin-route";
import { useMemo } from "react";

export function Component(props: IAdminPanelDraftProps) {
  const { currentPath, module, model } = useAdminRoute(null);

  // Determine current view based on route
  const isMainView = !currentPath.startsWith("/settings") && !currentPath.startsWith("/profile") && !currentPath.startsWith("/account");

  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      <EcommerceAdminV2Component
        adminBasePath="/admin"
        isSettingsView={false}
      >
        {/* Settings page - rendered as child when on settings route */}
        {currentPath === "/settings" && (
          <SettingsPageClientComponent adminBasePath="/admin" />
        )}

        {/* Account settings page - rendered as child when on profile/account route */}
        {(currentPath === "/profile" || currentPath.startsWith("/account")) && (
          <AccountSettingsPageClientComponent
            adminBasePath="/admin"
            onIdentityAction={() => {}}
            onLogout={() => {}}
          />
        )}

        {/* Default main content */}
        {isMainView && null}
      </EcommerceAdminV2Component>
    </section>
  );
}
```

**Alternative approach (if the above breaks routing):** Use conditional rendering at a higher level, or create a layout component that conditionally renders the appropriate view.

#### 2. Update settings-page to be a child-only component

**File:** `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx`
**Changes:** Remove the wrapper `EcommerceAdminV2Component` since it's now in the parent

```typescript
// Remove the outer <EcommerceAdminV2Component> wrapper (lines 220-268)
// Return only the content <section> element
```

#### 3. Update account-settings-page to be a child-only component

**File:** `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx`
**Changes:** Remove the wrapper `EcommerceAdminV2Component` since it's now in the parent

```typescript
// Remove the outer <EcommerceAdminV2Component> wrapper (lines 391-439)
// Return only the content <section> element
```

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `nx run host:build`

#### Manual Verification:

- [ ] Sidebar state persists when navigating between pages
- [ ] Can navigate to `/admin/settings` and see sidebar still open
- [ ] Can navigate to `/admin/modules/ecommerce/models/product` and see sidebar state preserved
- [ ] Settings page still renders correctly
- [ ] Account settings page still renders correctly

**Implementation Note:** After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Add RBAC Gating

### Overview

Implement role-based access control to ensure only users with admin role can access the admin panel.

### Changes Required

#### 1. Create admin role check hook

**File:** `libs/shared/frontend/client-hooks/src/lib/useAdminRole.ts`
**Changes:** New file containing role checking logic

```typescript
import { useSubject } from "@sps/rbac/frontend/component"; // Adjust import based on actual RBAC hooks location
import { useMemo } from "react";

export function useAdminRole() {
  const { data: subject } = useSubject(); // Need to verify actual hook name

  return useMemo(() => {
    if (!subject) return false;

    // Check if subject has admin role
    // This may require a subjects-to-roles relation check
    // Adjust based on actual RBAC implementation
    return subject.roles?.some?.((role: any) => role.title === "admin") ?? false;
  }, [subject]);
}

export function useRequireAdminRole(redirectTo = "/") {
  const isAdmin = useAdminRole();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin && typeof window !== "undefined") {
      router.replace(redirectTo);
    }
  }, [isAdmin, router, redirectTo]);

  return isAdmin;
}
```

#### 2. Create admin gate component

**File:** `libs/shared/frontend/components/src/lib/singlepage/admin-v2/gate/Component.tsx`
**Changes:** New component that wraps admin panel with RBAC check

```typescript
"use client";

import { IComponentProps } from "./interface";
import { useRequireAdminRole } from "@sps/shared-frontend-client-hooks/useAdminRole";

export interface IComponentProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function Component(props: IComponentProps) {
  const isAdmin = useRequireAdminRole(props.redirectTo);

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}
```

#### 3. Wrap admin panel with gate

**File:** `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`
**Changes:** Add RBAC gating at the component level

```typescript
import { Component as AdminGate } from "@sps/shared-frontend-components/singlepage/admin-v2/gate/Component";

// Wrap the entire section with AdminGate
<AdminGate redirectTo="/">
  <section
    data-variant="admin-panel-draft"
    data-testid="admin-prototype-body"
    className={...}
  >
    {/* existing content */}
  </section>
</AdminGate>
```

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `nx run host:build`

#### Manual Verification:

- [ ] Users with admin role can access `/admin/**`
- [ ] Users without admin role are redirected to home page
- [ ] Access denied message displays correctly for non-admin users
- [ ] Admin functionality works normally for admin users

**Implementation Note:** After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Standardize Relation Rendering and Remove Cross-Version Dependencies

### Overview

Standardize relation rendering across all forms and create admin-v2 select-input components to remove dependencies on admin-v1.

### Changes Required

#### 1. Create admin-v2 select-input component

**File:** `libs/shared/frontend/components/src/lib/singlepage/admin-v2/select-input/Component.tsx`
**Changes:** New admin-v2 select-input component (based on admin-v1 but adapted)

```typescript
import { IComponentProps } from "./interface";
import { Button } from "@sps/shared-ui-shadcn";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@sps/shared-ui-shadcn";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@sps/shared-ui-shadcn";
import { useMemo } from "react";

export interface IComponentProps<T = any> {
  module: string;
  name: string;
  label: string;
  formFieldName: string;
  data?: T[];
  form: any; // react-hook-form Control
  variant?: string;
  renderField?: string;
  renderFunction?: (entity: T) => string;
}

export function Component<T = any>(props: IComponentProps<T>) {
  const selectedValue = props.form.watch(props.formFieldName);
  const selectedEntity = useMemo(
    () => props.data?.find((item: any) => item.id === selectedValue),
    [props.data, selectedValue],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", !selectedValue && "text-muted-foreground")}
        >
          {selectedEntity
            ? props.renderFunction
              ? props.renderFunction(selectedEntity)
              : selectedEntity[props.renderField || "adminTitle"]
            : `Select ${props.label}...`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Search ${props.label}...`} className="h-9" />
          <CommandEmpty>No {props.label} found.</CommandEmpty>
          <CommandGroup>
            {props.data?.map((entity: any) => (
              <CommandItem
                key={entity.id}
                value={entity.id}
                onSelect={(value) => {
                  props.form.setValue(props.formFieldName, value);
                }}
              >
                {props.renderFunction
                  ? props.renderFunction(entity)
                  : entity[props.renderField || "adminTitle"]}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedValue === entity.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

#### 2. Update product select-input to use admin-v2

**File:** `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx`
**Changes:** Replace admin-v1 import with admin-v2

```typescript
// Change line 2:
// From: import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
// To: import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";
```

#### 3. Update products-to-attributes select-input to use admin-v2

**File:** `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx`
**Changes:** Replace admin-v1 import with admin-v2

```typescript
// Change line 2:
// From: import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
// To: import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";
```

#### 4. Standardize relation rendering style

**File:** `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`
**Changes:** Convert inline relation sections to use the same tabbed approach as product form

```typescript
// Add tabs structure similar to product form
// Move relation renders (attribute-keys-to-attributes, products-to-attributes, etc.) into a Relations tab
```

**Implementation details:**

- Add `Tabs` component import and state management for active tab
- Create "Details" tab with existing form fields
- Create "Relations" tab with all relation components
- Follow the same pattern as product form (lines 149-174)

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `nx run host:build`

#### Manual Verification:

- [ ] Product select dropdown works correctly
- [ ] Products-to-attributes select dropdown works correctly
- [ ] Attribute form has consistent Details/Relations tab structure
- [ ] All relation sections render correctly
- [ ] No console errors related to component imports

**Implementation Note:** After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Wire Live Data for Account Settings

### Overview

Replace hardcoded mock data in account settings with live SDK calls to display real user data.

### Changes Required

#### 1. Update account settings to use SDK hooks

**File:** `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx`
**Changes:** Replace mock data with actual SDK calls

```typescript
// Add imports:
import { api as rbacApi } from "@sps/rbac/module/sdk/client";
import { api as socialApi } from "@sps/social/module/sdk/client";

export function Component(props: IAccountSettingsPageProps) {
  const pathname = usePathname();
  const { currentPath } = useAdminRoute(pathname);

  // Fetch real data
  const { data: subject } = rbacApi.subject.find(); // Adjust based on actual API
  const { data: identities } = rbacApi.identity.find(); // With relation filters
  const { data: socialProfiles } = socialApi.profile.find(); // With relation filters

  // Replace mock data with real data
  const displaySubject = subject?.[0];
  const displayIdentities = identities || [];
  const displaySocialProfiles = socialProfiles || [];

  // ... rest of component using displaySubject, displayIdentities, displaySocialProfiles
```

#### 2. Remove mock data file

**File:** `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts`
**Changes:** Delete this file after confirming live data works

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `nx run host:build`

#### Manual Verification:

- [ ] Account settings displays real user data
- [ ] Identities list shows actual user identities
- [ ] Social profiles section shows actual profiles
- [ ] Data updates when user data changes

**Implementation Note:** After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: Clean Up Dead Code

### Overview

Remove unused code and clean up any remaining artifacts from the migration process.

### Changes Required

#### 1. Remove or refactor unused utils.tsx

**File:** `apps/host/src/components/admin-panel-draft/utils.tsx`
**Changes:** Either delete entirely or keep only truly needed utilities

```typescript
// Evaluate each exported function:
// - applyRoute: May still be needed, keep if used
// - All state machine functions: Remove if not called
// - Type definitions: Keep if used by other components
```

#### 2. Clean up unused imports

**Files:** All modified files in previous phases
**Changes:** Remove any unused imports added during refactoring

#### 3. Remove mock data file

**File:** `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts`
**Changes:** Delete this file

### Success Criteria

#### Automated Verification:

- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] No unused imports detected
- [ ] Build succeeds: `nx run host:build`

#### Manual Verification:

- [ ] All functionality still works
- [ ] No console warnings about unused code
- [ ] Clean codebase with no artifacts

---

## Testing Strategy

### Unit Tests:

- Test route parsing utility with various path inputs
- Test admin role check hook with different user states
- Test admin gate component with redirect scenarios

### Integration Tests:

- End-to-end navigation through admin panel
- CRUD operations for all pilot entities
- RBAC gating scenarios

### Manual Testing Steps:

1. **Navigation Test:**

   - Navigate to `/admin/modules/ecommerce`
   - Navigate to `/admin/modules/ecommerce/models/product`
   - Verify sidebar state persists
   - Navigate to `/admin/settings`
   - Navigate to `/admin/profile`
   - Verify all routes work correctly

2. **CRUD Test:**

   - Create a new product
   - Edit the product
   - Delete the product
   - Repeat for attributes and products-to-attributes

3. **RBAC Test:**

   - Log out and log in as non-admin user
   - Try to access `/admin/**`
   - Verify redirect to home page
   - Log out and log in as admin user
   - Verify access to admin panel

4. **Relation Rendering Test:**

   - Open product form
   - Verify Details and Relations tabs work
   - Open attribute form
   - Verify Details and Relations tabs work
   - Verify both have consistent styling

5. **Account Settings Test:**
   - Navigate to `/admin/profile`
   - Verify real data displays
   - Verify identity management works
   - Verify social profile links work

## Performance Considerations

- Route parsing should be memoized to avoid unnecessary recalculations
- RBAC check should be performed once and cached
- Select input dropdowns should use virtualization for large datasets
- Sidebar state management should use React context or URL state

## Migration Notes

### Rollback Plan:

If any phase introduces critical issues:

1. Revert changes to the affected files
2. Document the issue
3. Adjust the implementation approach

### Rollout to Other Modules:

After pilot stabilization:

1. Document the clean admin-v2 pattern
2. Create migration checklist for each module
3. Roll out module by module, validating after each

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-0142.md`
- Research findings: Referenced in ticket comments
- Draft design: `apps/drafts/incoming/admin-panel-redesign-html/`
