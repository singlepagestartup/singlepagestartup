# UI Adapter Components

A library of adapter components for the SinglePageStartup (SPS) project that provides a unified interface for working with different UI libraries and frameworks. These components act as a bridge between the application's business logic and various UI implementations.

## Structure

```
src/
└── lib/
    ├── chat-workspace/   # Workspace frame and responsive conversation/document panes
    ├── button/           # Button adapter component
    ├── form-field/       # Form field adapter component
    ├── file-preview/     # Attachment preview dialog
    ├── input/            # Input adapter component
    ├── toast/            # Shared Sonner notification renderer and status icons
    ├── icons/            # Shared React SVG icons
    ├── select/           # Select adapter component
    ├── interfaces/       # Common interfaces and types
    └── wrappers/         # Component wrappers and HOCs
```

## Purpose

The adapter components serve several key purposes:

1. **Abstraction Layer**: Provides a consistent interface regardless of the underlying UI implementation
2. **Framework Agnostic**: Allows switching between different UI frameworks without changing business logic
3. **Standardization**: Enforces consistent behavior and styling across the application
4. **Type Safety**: Ensures type safety through TypeScript interfaces

## Core Components

### Button Adapter

- Provides a unified button interface
- Handles different button variants and states
- Manages button interactions and events

### Form Field Adapter

- Standardizes form field behavior
- Handles validation and error states
- Manages form field interactions

### Input Adapter

- Provides consistent input handling
- Manages input states and validation
- Handles different input types

### Select Adapter

`Select` with `ui="shadcn"` renders the SPS-styled Radix Select used by Studio forms. Pass `options` with `value`, `label` and optional `disabled` fields. Use `value` and `onValueChange` for controlled selection. The adapter supports placeholders, required and disabled states, validation attributes and keyboard navigation.

### Icons

Import `Icon` and its `IconName` type from `@sps/ui-adapter`. The Phosphor Regular
glyphs are React SVG elements in `src/lib/icons`, usable in server and client
components. Color follows `currentColor`; `size` accepts 20 or 24 pixels, and
Tailwind classes can override the dimensions. Icons are decorative by default;
use SVG properties for an accessible label when the icon conveys meaning.

Static image files belong in `apps/host/public/images` or File Storage. Icons
use shared UI components directly rather than a Website Builder Feature variant.

### Chat workspace

`ChatWorkspace` and `ChatThreadPanel` are presentation components shared by the
production Social Profile/Thread views and the Website Builder landing demo.
The workspace supplies the navigation and fixed-height frame. The Thread panel
supplies the header, message scroll area and optional context sidebar. Desktop
navigation starts at `lg`. The header button toggles the 360px sidebar at `xl` and switches between the conversation and its details on smaller screens. The Website Builder landing demo uses
the same layout with its own document editing and download controls.

Pass navigation, messages, composer and context as rendered nodes. The panel
owns its display tab, with optional controlled `pane` and `onPaneChange` props.
Labels support `language="ru"`. Domain readers and actions stay in the caller.

### File preview

`FilePreview` from `@sps/ui-adapter` accepts a local `File`, a public
`src` or a callback that reads the file through its owning SDK. Pass `name`
and any available `mimeType` and `extension`. For a protected attachment,
pass `onDownload(signal?, maxBytes?)` and omit `src`. Keep the callback
stable for the lifetime of the authorized file. The adapter aborts pending
reads and releases object URLs when the file changes or the component unmounts.

Use `layout="message"` for the conversation or `layout="rail"` for the chat
sidebar. Message images keep their aspect ratio. The sidebar shows the file name
and type beside a 72-pixel image thumbnail. Both load images near the viewport.
Audio and video load when the user selects Play or opens the viewer. The
viewer supports full screen, image zoom, keyboard dismissal and downloading
the original when a byte reader or local file is available. Card and row
layouts are available for the composer and file lists. Set `language="ru"`
for Russian controls. The full props are in `src/lib/file-preview/interface.ts`.

PDF.js renders one page at a time with paging and zoom controls. HTML runs
in the sandboxed preview frame. Markdown supports Preview and Source,
disables raw HTML and shows inline image references as text. TXT, CSV, JSON,
LOG and YAML use plain text. A stored-file owner can supply a lazy
`textContent` reader. Text previews are limited to 2 MiB. SVG, scripts and
unsupported formats have a download action when the original is available.

### Toast notifications

Host mounts `Toaster` from `@sps/ui-adapter/toast` once in its root layout.
The same public UI-only entry is used by the Studio Toast catalog and module
previews. It imports no SDK, Provider, entity cache or application code.

The renderer owns the card, typography, border, shadow, close/action controls
and status icons. `Component.tsx` is the style entry and `icons.tsx` maps states
to Phosphor Regular glyphs from the existing static Icon library. Success uses
the primary accent, error uses destructive, and the remaining states use muted
surfaces. Cards use semantic theme colors. The spinner respects reduced motion.

Default placement is bottom-right, duration 4.5 seconds, with a close button.
Sonner keeps its existing store and transport API, so current SDK
`toast.error(...)` calls use the same mounted renderer. Producers pass content,
actions and IDs without defining visual options such as `richColors` or custom
classes. The profile save action follows this contract. The legacy shadcn
Toaster remains available for compatibility; Host uses the adapter entry.

```tsx
import { Toaster, toast } from "@sps/ui-adapter/toast";

// App shell, once:
<Toaster />;
// After a successful operation:
toast.success("Profile saved", {
  description: "Your changes have been saved.",
});
```

Storybook exposes all notification states, action/dismiss/loading interactions,
long text, stacked notifications, auto-dismiss and a persistent editing mode.
The Toast Icons story shows its seven glyphs; the general Shared Icon collection
also contains info, x-circle and spinner-gap. SVG sources are from the official
[Phosphor Regular collection](https://github.com/phosphor-icons/core/tree/main/assets/regular),
covered by the MIT license retained beside the runtime glyphs in `icons/LICENSE`.

## Usage

```typescript
import { ButtonAdapter, FormFieldAdapter, InputAdapter } from "@sps/shared/ui/adapter";

// Example usage of button adapter
<ButtonAdapter
  variant="primary"
  size="medium"
  onClick={handleClick}
>
  Click me
</ButtonAdapter>

// Example usage of form field adapter
<FormFieldAdapter
  label="Username"
  error={error}
  required
>
  <InputAdapter
    type="text"
    value={value}
    onChange={handleChange}
  />
</FormFieldAdapter>
```

## Component Structure

Each adapter component follows a consistent structure:

```typescript
// interface.ts
export interface IComponentProps {
  // Common props
}

export interface IComponentPropsExtended extends IComponentProps {
  // Extended props
}

// index.tsx
export { Component } from "./Component";

// Component.tsx
export const Component: React.FC<IComponentProps> = (props) => {
  // Implementation
};
```

## Integration with UI Libraries

The adapter components can be configured to work with different UI libraries:

```typescript
// Example configuration for shadcn/ui
import { Button as ShadcnButton } from "@sps/shared/ui/shadcn";

const ButtonAdapter: React.FC<IButtonProps> = (props) => {
  return <ShadcnButton {...props} />;
};
```

## Testing

Components are tested using Jest and React Testing Library. Test configuration is located in `jest.config.ts`.

## Best Practices

1. Always use adapter components instead of direct UI library components
2. Extend interfaces when adding new functionality
3. Keep adapter implementations simple and focused
4. Document any UI library-specific behavior
5. Maintain consistent prop naming across adapters

## License

MIT
