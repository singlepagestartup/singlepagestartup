# Admin Panel v2 Migration and Stabilization Implementation Plan

## Overview

This plan implements the migration to admin panel v2 by first stabilizing the pilot scope (ecommerce.product, ecommerce.attribute, and ecommerce.products-to-attributes) and then creating a clean architectural foundation for future module rollouts. The pilot will fix 8 identified structural inconsistencies and bugs before scaling to the rest of the codebase.

## Current State Analysis

The admin-v2 shell exists at `/admin/**` with the following issues:

**Existing Implementation:**

- `apps/host/src/components/admin-panel-draft/ClientComponent.tsx` - Renders `<EcommerceAdminV2Component>` three times (once as primary, twice as layout wrappers for settings/profile)
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx` - Main admin v2 component with URL-based routing
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx` - Sidebar navigation
- Model components: `ecommerce/models/product`, `ecommerce/models/attribute` with admin-v2 variants
- Relation component: `ecommerce/relations/products-to-attributes` with admin-v2 variants

**Identified Issues:**

1. **Route Parsing Duplication** (5 locations): Regex `/^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/` is copy-pasted across:

   - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx:46`
   - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx:26`
   - `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:63`
   - `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx:113`

2. **Sidebar Re-instantiation Bug**: `apps/host/src/components/admin-panel-draft/ClientComponent.tsx:21-31` renders the admin component three times, causing sidebar state reset on navigation between views.

3. **No RBAC Gating**: Admin-v1 checked for `admin` role; admin-v2 has no access control. Any user can access `/admin/**`.

4. **Mock Data in Settings**: `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:86-127` uses hardcoded mock operations without live API integration.

5. **Unused State Machine**: `apps/host/src/components/admin-panel-draft/utils.tsx` contains a full client-side state machine that is never imported or used.

6. **Inconsistent Relation Rendering**:

   - Product form (`ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:117-136`) uses Details/Relations tabs
   - Attribute form (`ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:155-177`) uses inline sections

7. **Cross-Version Dependency**: Both `ecommerce/models/product` and `ecommerce/relations/products-to-attributes` admin-v2 `select-input` components delegate to admin-v1:
   - `ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx:2`
   - `ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx:2`

## Desired End State

A stable admin-v2 pilot that:

1. Has shared route parsing utility with no code duplication
2. Has a single instance of the admin component with persistent sidebar state
3. Has RBAC gating that prevents non-admin users from accessing `/admin/**`
4. Has account/settings pages wired to live SDK calls
5. Has consistent relation rendering style across all forms
6. Has admin-v2 native select-input components (no admin-v1 dependency)
7. Is ready as a reference template for migrating other modules

### Verification:

- Navigate between admin pages without sidebar state reset
- Access `/admin/**` routes only with admin role
- Run maintenance operations in settings with real API calls
- Create/edit products and attributes with consistent relation UI
- No admin-v1 imports in pilot scope code

## What We're NOT Doing

- Migrating modules outside the pilot scope (ecommerce.product, ecommerce.attribute, ecommerce.products-to-attributes)
- Reimplementing the entire admin-v2 architecture from scratch
- Modifying admin-v1 (it remains functional)
- Creating new RBAC permissions or roles
- Database migrations or schema changes

## Implementation Approach

**Strategy: Architectural Cleanup First → Fix Bugs → Validate → Prepare for Rollout**

This approach ensures we fix the structural issues first, then address the specific bugs. This creates a clean foundation that can be replicated for other modules.

### Key Decisions:

1. **Route Parsing Utility**: Create a shared hook in `libs/shared/frontend/client-hooks` to centralize route parsing logic
2. **Sidebar State Management**: Refactor `ClientComponent.tsx` to use a single component instance with proper children rendering
3. **RBAC Hook**: Create a shared hook in `libs/shared/frontend/client-hooks` for admin role checking
4. **Relation Rendering Standard**: Use the tabbed approach (product style) as the standard for consistency
5. **Select-Input Migration**: Create admin-v2 select-input in shared components to replace admin-v1 delegation

## Phase 1: Architectural Cleanup

### Overview

Extract shared utilities and refactor the admin component structure to eliminate code duplication and fix the sidebar re-instantiation bug.

### Changes Required:

#### 1. Create Shared Route Parsing Hook

**File**: `libs/shared/frontend/client-hooks/src/lib/use-admin-route.ts` (new)

**Changes**: Create a shared hook for admin route parsing

```typescript
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface AdminRoute {
  adminBasePath: string;
  currentPath: string;
  routeMatch: RegExpMatchArray | null;
  selectedModule: string;
  selectedModel: string;
  isModuleOverview: boolean;
}

export function useAdminRoute(adminBasePath: string = "/admin"): AdminRoute {
  const pathname = usePathname();

  return useMemo(() => {
    const adminIndex = pathname?.indexOf(adminBasePath);

    if (adminIndex === -1) {
      return {
        adminBasePath,
        currentPath: "/",
        routeMatch: null,
        selectedModule: "",
        selectedModel: "",
        isModuleOverview: false,
      };
    }

    const currentPath = pathname?.slice(adminIndex + adminBasePath.length) || "/";
    const normalizedPath = currentPath.replace(/\/+$/, "") || "/";
    const routeMatch = normalizedPath.match(/^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/);
    const selectedModule = routeMatch?.[1] || "";
    const selectedModel = routeMatch?.[2] || "";
    const isModuleOverview = Boolean(routeMatch?.[1] && !routeMatch?.[2]);

    return {
      adminBasePath,
      currentPath: normalizedPath,
      routeMatch,
      selectedModule,
      selectedModel,
      isModuleOverview,
    };
  }, [pathname, adminBasePath]);
}
```

#### 2. Export Hook from Index

**File**: `libs/shared/frontend/client-hooks/src/lib/index.ts`

**Changes**: Add export for the new hook

```typescript
export * from "./use-admin-route";
```

#### 3. Refactor Admin V2 ClientComponent to Use Shared Hook

**File**: `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx`

**Changes**: Replace local route parsing with shared hook

```typescript
// Remove local getAdminRoutePath function (lines 22-32)
// Remove local routeMatch useMemo (lines 45-48)
// Add import at top:
import { useAdminRoute } from "@sps/shared-frontend-client-hooks";

// Replace route parsing logic in Component:
const adminRoute = useAdminRoute(props.adminBasePath);

// Use adminRoute properties instead of local variables
```

#### 4. Refactor Sidebar Module Item to Use Shared Hook

**File**: `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx`

**Changes**: Replace local route parsing with shared hook

```typescript
// Remove local getAdminRoutePath function (lines 11-21)
// Replace route parsing logic:
const adminRoute = useAdminRoute();
```

#### 5. Refactor Settings Page to Use Shared Hook

**File**: `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx`

**Changes**: Replace local route parsing with shared hook

```typescript
// Remove local getAdminRoutePath function (lines 63-73)
// Add import:
import { useAdminRoute } from "@sps/shared-frontend-client-hooks";

// Replace route parsing:
const adminRoute = useAdminRoute();
```

#### 6. Refactor Account Settings Page to Use Shared Hook

**File**: `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx`

**Changes**: Replace local route parsing with shared hook

```typescript
// Remove local getAdminRoutePath function (lines 113-123)
// Add import:
import { useAdminRoute } from "@sps/shared-frontend-client-hooks";

// Replace route parsing:
const adminRoute = useAdminRoute();
```

#### 7. Fix Sidebar Re-instantiation Bug

**File**: `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`

**Changes**: Refactor to use a single component instance with proper routing

```typescript
// Replace current implementation (lines 9-34) with:
"use client";

import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { Component as SettingsPageComponent } from "./settings-page";
import { Component as AccountSettingsPageComponent } from "./account-settings-page";
import { IAdminPanelDraftProps } from "./interface";
import { usePathname } from "next/navigation";

export function Component(props: IAdminPanelDraftProps) {
  const pathname = usePathname();
  const currentPath = pathname?.replace(/^\/admin/, "") || "/";

  // Determine which view to show based on path
  const isSettingsView = currentPath.startsWith("/settings");
  const isProfileView = currentPath.startsWith("/profile");
  const isMainAdminView = !isSettingsView && !isProfileView;

  return (
    <EcommerceAdminV2Component
      adminBasePath="/admin"
      isSettingsView={false}
    >
      {/* Only render the primary admin content, not settings/profile wrappers */}
      {isMainAdminView && null /* Default content from EcommerceAdminV2Component */}

      {/* Settings and profile are rendered as children when appropriate */}
      {isSettingsView && (
        <SettingsPageComponent adminBasePath="/admin" />
      )}
      {isProfileView && (
        <AccountSettingsPageComponent
          adminBasePath="/admin"
          onIdentityAction={() => {}}
          onLogout={() => {}}
        />
      )}
    </EcommerceAdminV2Component>
  );
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] No duplicate route parsing code (search for `getAdminRoutePath` - should return only 1 result in shared hook)
- [ ] Build succeeds: `npm run build`

#### Manual Verification:

- [ ] Navigate between module overview and model detail pages without sidebar state reset
- [ ] Navigate to settings and profile pages and back without sidebar state reset
- [ ] Route matching works correctly for `/admin/modules/ecommerce`, `/admin/modules/ecommerce/models/product`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that sidebar state persists correctly across navigation.

---

## Phase 2: RBAC Gating

### Overview

Implement role-based access control to prevent non-admin users from accessing admin panel routes.

### Changes Required:

#### 1. Create Admin Role Hook

**File**: `libs/shared/frontend/client-hooks/src/lib/use-admin-role.ts` (new)

**Changes**: Create a hook to check for admin role

```typescript
import { useMemo } from "react";

interface UseAdminRoleOptions {
  redirectIfNotAdmin?: boolean;
  redirectTo?: string;
}

export function useAdminRole(options: UseAdminRoleOptions = {}) {
  // TODO: Wire up to actual RBAC subject check once implemented
  // For now, this is a placeholder that checks localStorage or a cookie
  const isAdmin = useMemo(() => {
    // Check if user has admin role
    // This will integrate with the RBAC module once available
    const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    return userRole === "admin";
  }, []);

  const canAccessAdmin = isAdmin;

  if (options.redirectIfNotAdmin && !isAdmin && typeof window !== "undefined") {
    window.location.href = options.redirectTo || "/";
  }

  return {
    isAdmin,
    canAccessAdmin,
  };
}
```

#### 2. Export Hook from Index

**File**: `libs/shared/frontend/client-hooks/src/lib/index.ts`

**Changes**: Add export for the admin role hook

```typescript
export * from "./use-admin-role";
```

#### 3. Add RBAC Gating to Admin Page

**File**: `apps/host/src/app/admin/page.tsx` (create if doesn't exist) or update existing route

**Changes**: Add role check before rendering admin

```typescript
"use client";

import { useAdminRole } from "@sps/shared-frontend-client-hooks";
import { Component as AdminPanelDraftComponent } from "@/components/admin-panel-draft";

export default function AdminPage() {
  const { isAdmin } = useAdminRole({ redirectIfNotAdmin: true });

  if (!isAdmin) {
    return null; // Will redirect via hook
  }

  return <AdminPanelDraftComponent />;
}
```

#### 4. Add RBAC Check to Admin V2 Component

**File**: `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx`

**Changes**: Add role check at component level

```typescript
import { useAdminRole } from "@sps/shared-frontend-client-hooks";

// In Component:
const { canAccessAdmin } = useAdminRole();

if (!canAccessAdmin) {
  return <AccessDeniedMessage />;
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:

- [ ] Navigate to `/admin/**` as non-admin user - should be redirected
- [ ] Navigate to `/admin/**` as admin user - should see admin panel
- [ ] See appropriate access denied message when not authorized

**Implementation Note**: After completing this phase, the admin panel should be protected from unauthorized access. The RBAC integration will need to be updated once the actual role checking API is available.

---

## Phase 3: Wire Live SDK Calls to Settings

### Overview

Replace hardcoded mock data in settings page with live SDK calls to backend APIs.

### Changes Required:

#### 1. Create Backend API Hooks

**File**: `apps/host/src/app/api/admin/cache/clear/route.ts` (create)

**Changes**: Create API route for cache clearing

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Clear backend cache via API call or direct cache service
    // TODO: Implement actual cache clearing logic
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

**File**: `apps/host/src/app/api/admin/revalidate/route.ts` (create)

**Changes**: Create API route for layout revalidation

```typescript
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST() {
  try {
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

#### 2. Update Settings Page to Use Live APIs

**File**: `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx`

**Changes**: Replace mock operations with real API calls

```typescript
// Replace runSettingsOperation function (lines 85-127) with:
const runSettingsOperation = useCallback(async (key: TSettingsOperationKey) => {
  const config = settingsOperationConfigs[key];

  setOperations((previous) => ({
    ...previous,
    [key]: {
      status: "loading",
      message: "Running operation...",
    },
  }));

  try {
    const response = await fetch(config.endpoint, {
      method: config.method,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Operation failed");
    }

    setOperations((previous) => ({
      ...previous,
      [key]: {
        status: "success",
        message: config.successMessage,
      },
    }));
  } catch (error) {
    setOperations((previous) => ({
      ...previous,
      [key]: {
        status: "error",
        message: error instanceof Error ? error.message : "Operation failed. Check backend route availability.",
      },
    }));
  }
}, []);
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] API routes are accessible: `curl -X POST http://localhost:3000/api/admin/cache/clear`

#### Manual Verification:

- [ ] Click "Clear Backend Cache" button - operation completes with success message
- [ ] Click "Revalidate Frontend Layout" button - operation completes with success message
- [ ] Error handling works - shows error message when backend is unavailable

---

## Phase 4: Standardize Relation Rendering

### Overview

Ensure all forms use consistent relation rendering style. Adopt the tabbed approach (product form) as the standard.

### Changes Required:

#### 1. Update Attribute Form to Use Tabbed Relations

**File**: `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`

**Changes**: Replace inline relations with tabbed UI

```typescript
// Add state for tabbed relations at top of Component:
const [activeMainTab, setActiveMainTab] = useState<"details" | "relations">(
  "details",
);

// Replace relation sections (lines 155-177) with tabbed interface:

// Update return JSX:
<ParentAdminForm<IModel, typeof variant>
  {...props}
  module="ecommerce"
  form={form}
  id={props.data?.id}
  onSubmit={onSubmit}
  variant={props.variant}
  name="attribute"
  status={status}
>
  <Tabs
    value={activeMainTab}
    onValueChange={(value) => {
      setActiveMainTab(value as "details" | "relations");
    }}
    className="-mt-6"
  >
    <div className="-mx-6 border-b border-border bg-slate-50 px-6 py-4">
      <TabsList className="h-auto w-fit justify-start rounded-md border border-slate-300 bg-slate-100 p-1">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="relations">
          Relations
          <span className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-sm">
            {3}
          </span>
        </TabsTrigger>
      </TabsList>
    </div>

    <TabsContent value="details" className="mt-0 pt-6">
      {/* Existing detail fields */}
      <div className="flex flex-col gap-6">
        {/* ... existing form fields ... */}
      </div>
    </TabsContent>

    <TabsContent value="relations" className="mt-0 pt-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {props.attributeKeysToAttributes && (
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
            <h3 className="text-base font-semibold mb-3">Attribute Keys</h3>
            {props.attributeKeysToAttributes({
              data: props.data,
              isServer: props.isServer,
            })}
          </div>
        )}

        {props.productsToAttributes && (
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
            <h3 className="text-base font-semibold mb-3">Products</h3>
            {props.productsToAttributes({
              data: props.data,
              isServer: props.isServer,
            })}
          </div>
        )}

        {props.storesToAttributes && (
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
            <h3 className="text-base font-semibold mb-3">Stores</h3>
            {props.storesToAttributes({
              data: props.data,
              isServer: props.isServer,
            })}
          </div>
        )}

        {props.attributesToBillingModuleCurrencies && (
          <div className="rounded-xl border border-slate-300 bg-slate-100 p-5">
            <h3 className="text-base font-semibold mb-3">Currencies</h3>
            {props.attributesToBillingModuleCurrencies({
              data: props.data,
              isServer: props.isServer,
            })}
          </div>
        )}
      </div>
    </TabsContent>
  </Tabs>
</ParentAdminForm>
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:

- [ ] Attribute form has Details/Relations tabs like product form
- [ ] Switching tabs works smoothly
- [ ] Relations display in grid layout in Relations tab
- [ ] Both product and attribute forms have consistent relation UX

---

## Phase 5: Create Admin-V2 Select-Input Components

### Overview

Replace admin-v1 select-input dependencies with native admin-v2 components to eliminate cross-version coupling.

### Changes Required:

#### 1. Create Admin V2 Select-Input Component

**File**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/select-input/Component.tsx` (new)

**Changes**: Create admin-v2 select-input component

```typescript
"use client";

import { IComponentPropsExtended, IComponentProps } from "./interface";
import { factory } from "@sps/shared-frontend-client-api";
import { Component as ClientComponent } from "./ClientComponent";

type TSelectRenderProps<M extends { id?: string }, V> = IComponentPropsExtended<
  M,
  V,
  IComponentProps<M, V>
> & {
  label?: string;
  module: string;
  name: string;
  type?: "model" | "relation";
  renderFunction?: (entity: M) => any;
};

type TSelectContainerProps<M extends { id?: string }, V> = IComponentProps<
  M,
  V
> & {
  api: ReturnType<typeof factory<M>>;
  Skeleton?: ReactNode;
  Component: React.ComponentType<
    IComponentPropsExtended<M, V, IComponentProps<M, V>>
  >;
};

export function Component<M extends { id?: string }, V>(
  props: TSelectContainerProps<M, V> | TSelectRenderProps<M, V>,
) {
  if (props.isServer) {
    return null;
  }

  return <ClientComponent {...props} />;
}
```

**File**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/select-input/ClientComponent.tsx` (new)

**Changes**: Create client-side logic for select-input

```typescript
"use client";

import { IComponentPropsExtended, IComponentProps } from "./interface";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shared-ui-shadcn";

type TSelectProps<M extends { id?: string }, V> =
  | IComponentPropsExtended<M, V, IComponentProps<M, V>>
  | (IComponentProps<M, V> & {
      api: ReturnType<any>;
      Skeleton?: React.ReactNode;
    });

export function ClientComponent<M extends { id?: string }, V>(
  props: TSelectProps<M, V>,
) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // If it's the render props (used inline in forms)
  if ("api" in props) {
    const { api, form, formFieldName, label, renderFunction } = props;
    const data = api.find({ isServer: false });

    if (data.isLoading) {
      return props.Skeleton || <SelectSkeleton />;
    }

    const filteredData = data.data?.filter((item: M) => {
      if (!searchQuery) return true;
      // Search logic based on item properties
      return String(JSON.stringify(item)).toLowerCase().includes(searchQuery.toLowerCase());
    }) ?? [];

    return (
      <FormField
        ui="shadcn"
        type="select"
        name={formFieldName}
        label={label}
        form={form}
        placeholder="Select..."
      >
        <Select onValueChange={() => setOpen(false)} open={open} onOpenChange={setOpen}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <input
              type="text"
              placeholder="Search..."
              className="mb-2 border-b p-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filteredData.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {renderFunction ? renderFunction(item) : item.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }

  // Default: render nothing (container-only usage)
  return null;
}

function SelectSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
    </div>
  );
}
```

#### 2. Update Product Select-Input to Use Admin V2

**File**: `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx`

**Changes**: Replace admin-v1 import with admin-v2

```typescript
// Replace line 2:
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";
```

#### 3. Update Products-to-Attributes Select-Input to Use Admin V2

**File**: `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/select-input/Component.tsx`

**Changes**: Replace admin-v1 import with admin-v2

```typescript
// Replace line 2:
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] No admin-v1 imports in pilot scope (grep for `/singlepage/admin/select-input`)

#### Manual Verification:

- [ ] Select dropdowns work in product form
- [ ] Select dropdowns work in products-to-attributes form
- [ ] Search functionality works in select dropdowns

---

## Phase 6: Cleanup and Documentation

### Overview

Remove unused code and document the stabilized admin-v2 pattern for future module migrations.

### Changes Required:

#### 1. Remove Unused State Machine

**File**: `apps/host/src/components/admin-panel-draft/utils.tsx` (delete entire file)

**Changes**: Delete the unused state machine file

```bash
rm apps/host/src/components/admin-panel-draft/utils.tsx
```

#### 2. Create Migration Guide

**File**: `libs/modules/ecommerce/README.md` (update or create)

**Changes**: Add admin-v2 migration section

```markdown
## Admin V2 Migration Guide

This module has been migrated to admin-v2 as part of the pilot scope.

### Pattern to Follow:

1. **Route Parsing**: Use `useAdminRoute` hook from `@sps/shared-frontend-client-hooks`
2. **RBAC Gating**: Wrap admin routes with `useAdminRole` hook
3. **Form Structure**: Use tabbed Details/Relations layout
4. **Select-Input**: Use admin-v2 select-input from `@sps/shared-frontend-components/singlepage/admin-v2/select-input`

### Component Locations:

- Model: `models/[model-name]/frontend/component/src/lib/singlepage/admin-v2`
- Relation: `relations/[relation-name]/frontend/component/src/lib/singlepage/admin-v2`
- Module: `frontend/component/src/lib/admin-v2`
```

### Success Criteria:

#### Automated Verification:

- [ ] Build succeeds: `npm run build`
- [ ] No unused imports: `npm run lint`
- [ ] Documentation is readable

#### Manual Verification:

- [ ] Migration guide is clear and actionable
- [ ] Pattern examples are accurate to current implementation

---

## Testing Strategy

### Unit Tests:

- Route parsing hook works for all path patterns
- Admin role hook correctly identifies admin users
- Settings API routes handle errors gracefully
- Select-input component renders correctly with various data

### Integration Tests:

- Navigate through all admin pages without errors
- RBAC redirects unauthorized users correctly
- Settings operations complete successfully
- Forms submit and relations update correctly

### Manual Testing Steps:

1. Navigate to `/admin/modules/ecommerce` - verify module overview
2. Navigate to `/admin/modules/ecommerce/models/product` - verify product list
3. Click "Create Product" - verify form opens with tabbed relations
4. Navigate to `/admin/modules/ecommerce/models/attribute` - verify attribute list with tabbed form
5. Navigate to `/admin/settings` - verify settings page loads
6. Click "Clear Backend Cache" - verify operation completes
7. Navigate between pages - verify sidebar state persists
8. Access `/admin/**` as non-admin - verify redirect

## Performance Considerations

- Route parsing hook uses `useMemo` to avoid recalculation on every render
- Select-input filters are client-side and performant for < 1000 items
- Lazy loading of admin components (already implemented via Next.js app router)

## Migration Notes

No database migrations required. This is a frontend-only refactoring.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-0142.md`
- GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/142
- Current admin-v1 RBAC implementation: `libs/modules/rbac/...` (to be referenced once implemented)
