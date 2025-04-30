# Client Store

A library for managing client-side state in the SinglePageStartup (SPS) application. Built on Zustand and provides persistent storage capabilities.

## Structure

```
src/
├── lib/
│   ├── global-actions-store.ts  # Global actions tracking store
│   └── persistent-message-query.ts # Persistent message query store
```

## Core Components

### Global Actions Store

- `globalActionsStore` - Store for tracking global actions

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

### Persistent Message Query

- `persistentMessageQuery` - Store for persistent message queries

  ```typescript
  import { persistentMessageQuery } from "@sps/shared/frontend/client/store";

  // Add a message
  persistentMessageQuery.getState().addMessage({
    id: "message_id",
    service: "service_name",
    data: {},
  });
  ```

## Usage

```typescript
import {
  globalActionsStore,
  persistentMessageQuery,
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

// Using persistent message query
function MessageComponent() {
  const { addMessage } = persistentMessageQuery.getState();

  const handleMessage = () => {
    addMessage({
      id: "message_id",
      service: "service_name",
      data: {}
    });
  };

  return <button onClick={handleMessage}>Send Message</button>;
}
```

## Notes

- Uses Zustand for state management
- Implements persistent storage using localStorage/sessionStorage
- Supports action tracking with automatic cleanup (max 10 actions per store)
- Includes devtools support in development mode
- Handles cross-tab synchronization for persistent stores

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
