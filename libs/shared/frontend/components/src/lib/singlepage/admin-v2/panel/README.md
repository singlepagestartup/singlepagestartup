# admin-v2/panel

## Purpose

Sidebar panel for admin-v2: menu container plus `Settings` action.
Supports collapsed/expanded state and settings active state.

## Runtime mode

- `index.tsx` / `Component.tsx` route to server/client branch.
- Interactive sidebar state is implemented in `ClientComponent.tsx`.

## Key props

- `children` — sidebar items.
- `showSettingsButton` — show/hide settings block.
- `settingsHref` — link mode for settings action.
- `onOpenSettings` — callback mode when link is not used.
- `isSettingsView` — marks settings action as active.

## Minimal example

```tsx
<Panel isServer={false} settingsHref="/admin/settings" isSettingsView={false}>
  <SidebarItems />
</Panel>
```

## Boundaries

- Panel does not own sidebar item composition.
- Panel does not implement module routing logic beyond rendering the provided settings link.
