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
The workspace supplies the dark project navigation and fixed-height frame;
the Thread panel supplies its header, scroll areas and responsive Chat/Document
switch. Desktop navigation starts at `lg`; the 360px document column appears
at `xl`. Below those breakpoints, the owner supplies mobile navigation and the
panel switch selects the visible content.

Pass navigation, messages, composer, knowledge and download controls as rendered
nodes. The panel owns only its display tab, with optional controlled `pane` and
`onPaneChange` props. Labels support `language="ru"`; domain readers, permissions,
requests and mutations remain in the owning module. The adapter imports no SDK.

### File preview

`FilePreview` from `@sps/ui-adapter` renders a keyboard-accessible thumbnail
button and a centered dialog. Pass a local `File` through `localFile` to preview
an unsent attachment, or pass `src`, `mimeType`, `extension` and `name` for a
stored file. Set `language="ru"` for Russian preview controls and messages; the
default remains English. Its props live in `src/lib/file-preview/interface.ts`.

Images support zoom. PDF.js loads on demand and renders one PDF page at a time
with page and zoom controls; its worker is bundled with the app. Markdown has
Preview and Source modes, while TXT, CSV, JSON, LOG and YAML use plain text.
Markdown raw HTML is disabled, unsafe links are omitted and inline image
references remain text. Other formats show an original/download fallback.
Document thumbnails use foreground-colored Lucide glyphs and a format label
on the muted background.

The adapter imports no business SDK. A stored-file owner supplies a lazy
`textContent` JSX reader and an `onDownload(signal?)` callback for original
bytes. The callback also supplies PDF bytes and can abort when the dialog
closes. Local files use browser object URLs and are never uploaded by preview.
The adapter revokes these URLs on cleanup. Text preview is limited to 2 MiB;
opening or downloading the original remains available when preview fails.

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
