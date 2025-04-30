# UI Adapter Components

A library of adapter components for the SinglePageStartup (SPS) project that provides a unified interface for working with different UI libraries and frameworks. These components act as a bridge between the application's business logic and various UI implementations.

## Structure

```
src/
└── lib/
    ├── button/           # Button adapter component
    ├── form-field/       # Form field adapter component
    ├── input/            # Input adapter component
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
