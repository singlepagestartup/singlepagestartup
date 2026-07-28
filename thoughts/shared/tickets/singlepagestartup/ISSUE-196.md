# Issue: feat: add universal admin visual editor overlay for frontend components

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/196
**Status**: Research Needed
**Created**: 2026-06-12
**Priority**: medium
**Size**: medium

---

## Problem to Solve

Authenticated administrators need a universal frontend-only visual editing affordance that exposes administration tools directly on rendered project pages. Instead of forcing an admin user to navigate to a separate administration panel, eligible frontend components should be able to show an overlay similar to the provided screenshot: a full-component outline, module/model labels, and controls for opening an administration sidebar or modal for the selected entity.

The feature must work through a shared component or shared wrapper API so modules can opt in consistently without duplicating overlay behavior across every frontend component.

## Key Details

- Show the administration overlay only after authentication as a user with the `admin` role.
- The visual treatment should outline the entire wrapped component, using an admin-visible border mode like the screenshot.
- Display component administration metadata on the overlay, including at minimum the module name and model or relation name.
- Provide primary controls for administration actions, including opening a sidebar or modal editor for the selected component.
- Support action controls such as `Edit` and `Delete` where the wrapped entity and permissions allow those operations.
- Avoid redirecting the user to a separate administration panel for the primary edit flow.
- Keep the approach universal through a shared frontend component, provider, or wrapper that can be reused by business modules.
- The wrapper should avoid layout shifts, text overlap, and pointer-event conflicts with the wrapped component.
- The overlay must not leak admin controls, entity metadata, or destructive actions to unauthenticated users or non-admin roles.
- Use TailwindCSS and existing frontend conventions only; do not introduce ad-hoc CSS.
- Use existing SDK providers and module data-access patterns for any entity reads or mutations.

## Implementation Notes

- Start by researching existing shared frontend component packages and authentication/session role access patterns.
- Design a shared API such as an `AdminEditable` wrapper or visual editor provider that accepts module, entity type, entity id, labels, and supported actions.
- The shared component should render children normally for non-admin users and only render the admin overlay when the active subject has the `admin` role.
- The edit flow should be extensible: modules should be able to provide a sidebar/modal body or an action callback without coupling the shared wrapper to one module.
- Consider whether the feature needs a global admin visual-edit mode toggle, or whether admin overlays should always be visible for admin users.
- The screenshot reference shows an orange dashed outline around a large `website-builder` / `widget` component with module/model labels and top-right `Edit` / `Delete` controls.

## Acceptance Tests

- BDD tests cover that non-authenticated and non-admin users render wrapped content without the administration overlay.
- BDD tests cover that an authenticated `admin` user sees the component outline, module label, model/relation label, and action controls.
- BDD tests cover opening the sidebar or modal editor from the shared overlay.
- BDD tests cover hiding or disabling destructive controls when the wrapped entity does not support deletion or the current user lacks permission.
- BDD tests cover at least one real module/component integration using the shared wrapper.
