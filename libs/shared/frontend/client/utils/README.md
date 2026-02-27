# Client Utils

Client-side utility library for SinglePageStartup (SPS). Provides functions for working with authorization, headers, and other client-side tasks.

## Structure

```
src/
├── lib/
│   ├── authorization/    # Authorization utilities
│   │   └── headers.ts    # Read authorization headers from cookies
│   ├── saturate-headers/ # Header merging
│   │   └── index.ts      # Merge user-provided and authorization headers
│   └── cn/              # CSS class utilities
```

## Functions

### Authorization & Headers

- `authorization.headers()` — Read authorization headers from cookies

  ```typescript
  const headers = authorization.headers();
  // Returns:
  // {
  //   Authorization: "Bearer <jwt>",
  //   "X-RBAC-SECRET-KEY": "<secret-key>"
  // }
  ```

- `saturateHeaders(userHeaders?)` — Merge user-provided headers with authorization headers
  ```typescript
  const headers = saturateHeaders({ "Content-Type": "application/json" });
  // Returns merged headers including authorization
  ```

### CSS Classes

- `cn(...inputs)` — Conditionally join CSS class names
  ```typescript
  const className = cn("base-class", condition && "conditional-class", { "object-class": true });
  ```

## Usage

```typescript
import { authorization, saturateHeaders, cn } from "@sps/shared/frontend/client/utils";

// Working with headers
const headers = saturateHeaders({
  "Content-Type": "application/json",
  "Custom-Header": "value",
});

// Working with CSS classes
const buttonClass = cn("button", isActive && "button--active", { "button--disabled": isDisabled });
```

## Notes

- All functions run on the client side
- Authorization headers are added automatically
- `cn` uses the `clsx` library internally

## Testing

Uses Jest. Configuration in `jest.config.ts`.

## License

MIT
