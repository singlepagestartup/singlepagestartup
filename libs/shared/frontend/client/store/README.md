# Client Store

A library for managing client-side state in the SinglePageStartup (SPS) application. Built on Zustand and provides persistent storage capabilities.

## Why This Approach

- The project separates concerns:
  - React Query stores server data.
  - Client store keeps lightweight runtime events and helper state.
- `global-actions-store` is used as an event bus between websocket revalidation messages and query invalidation logic.
- Keeping this layer outside feature components avoids duplicated listeners and circular dependencies between modules.
- A bounded event history (`MAX_ACTIONS`) keeps memory usage predictable.

## Structure

```
src/
├── lib/
│   └── global-actions-store.ts  # Global actions tracking store
```

## Core Components

### Global Actions Store

- `globalActionsStore` - Store for tracking global actions
- Detailed internals: `libs/shared/frontend/client/store/src/lib/README.md`

  ```typescript
  import { globalActionsStore } from "@sps/shared/frontend/client/store";

  // Add an action
  globalActionsStore.getState().addAction({
    type: "action_type",
    name: "action_name",
    requestId: "unique_id",
    timestamp: Date.now(),
    props: {},
    result: {},
  });

  // Get actions by name
  const actions = globalActionsStore.getState().getActionsFromStoreByName("action_name");
  ```

## Usage

```typescript
import {
  globalActionsStore,
  useGlobalActionsStore
} from "@sps/shared/frontend/client/store";

// Using global actions store
function Component() {
  const { addAction } = useGlobalActionsStore();

  const handleAction = () => {
    addAction({
      type: "action_type",
      name: "action_name",
      requestId: "unique_id",
      timestamp: Date.now(),
      props: {},
      result: {}
    });
  };

  return <button onClick={handleAction}>Trigger Action</button>;
}
```

## Notes

- Uses Zustand for state management
- Supports action tracking with automatic cleanup (max 10 actions per store)
- Includes devtools support in development mode

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
