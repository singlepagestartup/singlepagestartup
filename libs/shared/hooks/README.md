# Shared Hooks

A collection of reusable React hooks for the SinglePageStartup (SPS) project. These hooks provide common functionality that can be used across different components and features.

## Purpose

The hooks library serves several key purposes:

1. **Code Reusability**: Share common logic across components
2. **State Management**: Handle complex state logic
3. **Side Effects**: Manage side effects in a consistent way
4. **Performance**: Optimize component rendering
5. **Type Safety**: Ensure type safety with TypeScript

## Available Hooks

### State Management

- `useLocalStorage`: Persist state in localStorage
- `useSessionStorage`: Persist state in sessionStorage
- `useDebounce`: Debounce value changes
- `useThrottle`: Throttle value changes

### Form Handling

- `useForm`: Handle form state and validation
- `useField`: Manage individual form fields
- `useFormValidation`: Form validation logic

### API Integration

- `useQuery`: Handle data fetching
- `useMutation`: Handle data mutations
- `useInfiniteQuery`: Handle infinite scrolling data

### UI/UX

- `useMediaQuery`: Respond to media queries
- `useIntersectionObserver`: Track element visibility
- `useResizeObserver`: Track element dimensions
- `useClickOutside`: Handle clicks outside elements

### Performance

- `useMemoCompare`: Compare memoized values
- `useCallbackRef`: Create stable callback refs
- `useIsomorphicLayoutEffect`: Use layout effect safely

## Usage

```typescript
import { useLocalStorage, useDebounce, useQuery, useMediaQuery } from "@sps/shared/hooks";

// Example: Local storage hook
const [value, setValue] = useLocalStorage("key", "default");

// Example: Debounce hook
const debouncedValue = useDebounce(value, 500);

// Example: Query hook
const { data, isLoading } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
});

// Example: Media query hook
const isMobile = useMediaQuery("(max-width: 768px)");
```

## Hook Structure

Each hook follows a consistent structure:

```typescript
// useHook.ts
import { useState, useEffect } from "react";

export function useHook<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup logic
    };
  }, [value]);

  return [value, setValue];
}
```

## Best Practices

1. **Naming**:

   - Prefix all hooks with `use`
   - Use descriptive names
   - Follow React naming conventions

2. **Implementation**:

   - Keep hooks focused and single-purpose
   - Handle cleanup properly
   - Optimize performance
   - Provide proper TypeScript types

3. **Testing**:

   - Test hook behavior
   - Test edge cases
   - Test cleanup functions

4. **Documentation**:
   - Document parameters
   - Document return values
   - Provide usage examples
   - Document edge cases

## Testing

Hooks are tested using:

- React Testing Library
- Custom hook testing utilities
- Jest for unit tests

## License

MIT
