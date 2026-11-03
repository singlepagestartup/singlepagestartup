# Shadcn UI Components

A collection of reusable UI components based on [shadcn/ui](https://ui.shadcn.com/) for the SinglePageStartup (SPS) project. These components are built using Radix UI primitives and styled with Tailwind CSS.

## Structure

```
src/
└── lib/
    ├── accordion/         # [Accordion](https://ui.shadcn.com/docs/components/accordion) - Vertically stacked interactive headings
    ├── alert-dialog/      # [Alert Dialog](https://ui.shadcn.com/docs/components/alert-dialog) - Modal dialog for alerts
    ├── badge/            # [Badge](https://ui.shadcn.com/docs/components/badge) - Small status indicators
    ├── button/           # [Button](https://ui.shadcn.com/docs/components/button) - Clickable elements
    ├── calendar/         # [Calendar](https://ui.shadcn.com/docs/components/calendar) - Date picker component
    ├── card/             # [Card](https://ui.shadcn.com/docs/components/card) - Content container
    ├── carousel/         # [Carousel](https://ui.shadcn.com/docs/components/carousel) - Slideshow component
    ├── checkbox/         # [Checkbox](https://ui.shadcn.com/docs/components/checkbox) - Toggle input
    ├── collapsible/      # [Collapsible](https://ui.shadcn.com/docs/components/collapsible) - Expandable content
    ├── command/          # [Command](https://ui.shadcn.com/docs/components/command) - Command palette
    ├── datetime/         # [Date Picker](https://ui.shadcn.com/docs/components/date-picker) - Date and time picker
    ├── dialog/           # [Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal dialog
    ├── dropdown-menu/    # [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu) - Context menu
    ├── file-input/       # [Input](https://ui.shadcn.com/docs/components/input) - File upload input
    ├── form/             # [Form](https://ui.shadcn.com/docs/components/form) - Form components
    ├── input/            # [Input](https://ui.shadcn.com/docs/components/input) - Text input
    ├── input-otp/        # [Input OTP](https://ui.shadcn.com/docs/components/input-otp) - One-time password input
    ├── label/            # [Label](https://ui.shadcn.com/docs/components/label) - Form labels
    ├── popover/          # [Popover](https://ui.shadcn.com/docs/components/popover) - Floating content
    ├── radio-group/      # [Radio Group](https://ui.shadcn.com/docs/components/radio-group) - Radio button group
    ├── select/           # [Select](https://ui.shadcn.com/docs/components/select) - Dropdown select
    ├── skeleton/         # [Skeleton](https://ui.shadcn.com/docs/components/skeleton) - Loading placeholder
    ├── slider/           # [Slider](https://ui.shadcn.com/docs/components/slider) - Range input
    ├── sonner/           # [Toast](https://ui.shadcn.com/docs/components/toast) - Toast notifications
    ├── table/            # [Table](https://ui.shadcn.com/docs/components/table) - Data table
    ├── tabs/             # [Tabs](https://ui.shadcn.com/docs/components/tabs) - Tabbed interface
    ├── tiptap/           # [Textarea](https://ui.shadcn.com/docs/components/textarea) - Rich text editor
    ├── toggle/           # [Toggle](https://ui.shadcn.com/docs/components/toggle) - Switch toggle
    ├── toggle-group/     # [Toggle Group](https://ui.shadcn.com/docs/components/toggle-group) - Group of toggles
    └── tooltip/          # [Tooltip](https://ui.shadcn.com/docs/components/tooltip) - Information tooltip
```

## Features

- Built on top of Radix UI primitives
- Fully accessible components
- Customizable with Tailwind CSS
- Dark mode support
- Responsive design
- TypeScript support
- Form validation integration

## Usage

```typescript
import { Button } from "@sps/shared/ui/shadcn";

// Example usage
<Button variant="default" size="lg">
  Click me
</Button>
```

Each component follows the same structure:

- `interface.ts` - TypeScript interfaces
- `index.tsx` - Component exports
- `Component.tsx` - Main component implementation

## Styling

Components can be styled using Tailwind CSS classes. The default theme can be customized in your project's `tailwind.config.js`.

```typescript
// Example of custom styling
<Button className="bg-custom-color hover:bg-custom-color-dark">
  Custom Button
</Button>
```

## Form Integration

Form components are designed to work seamlessly with React Hook Form:

```typescript
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@sps/shared/ui/shadcn";

const form = useForm({
  defaultValues: {
    username: "",
  },
});

<Form {...form}>
  <FormField
    control={form.control}
    name="username"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
      </FormItem>
    )}
  />
</Form>
```

## Testing

Components are tested using Jest and React Testing Library. Test configuration is located in `jest.config.ts`.

## License

MIT

## Local source and upstream updates

Import dialogs, sheets and other primitives from `@sps/shared-ui-shadcn` in
module views. Radix imports belong inside these shared components.

shadcn distributes source files that the application owns. Its CLI can supply
upstream changes; those changes still need a diff review and interaction checks
before replacing local files. These files do not update through a shadcn runtime
package. See the [shadcn introduction](https://ui.shadcn.com/docs).

`DialogContent` and `SheetContent` accept an optional `closeLabel` for the hidden
close-button text. The default remains `Close`; portal, focus, dismissal and
Radix props keep their existing contracts. The cart uses `SheetContent` with a
Russian label and local layout classes. This extension needs to be retained or
reconciled when importing a new upstream version.
