# Client Store

The shared Zustand runtime event log for SinglePageStartup (SPS). It connects
SDK request tracking and WebSocket revalidation with React Query subscriptions.

## Why This Approach

- The project separates concerns:
  - React Query caches API results in memory under the standard API Provider.
  - `globalActionsStore` keeps recent runtime events grouped by name.
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
  import { globalActionsStore } from "@sps/shared-frontend-client-store";

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
} from "@sps/shared-frontend-client-store";

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

## Realtime flow

1. Database capture commits generations and an outbox entry with the mutation.
2. The shared runtime assigns a durable delivery cursor after Next tag
   invalidation. Host receives private ref notifications on one WebSocket and
   routes them through the query consistency lifecycle to React Query.
3. Host records compact notification diagnostics under `consistency` in
   `globalActionsStore`. These records have counts/cursors, no entity bodies,
   credentials or opaque capabilities. The store is not a replay checkpoint.
4. Legacy frames enter the store under `revalidation`. SDK `subscription(...)`
   matches their topics or routes only for queries without accepted, unexpired
   consistency coverage. Active matching queries refetch.

Factory SDKs provide the subscriptions. Hand-written SDK queries must register
and clean up their subscriptions and preserve topic metadata. Local mutation
cache patches update the acting client; WebSocket reconciliation also reaches
other subscribed clients. See the [Client API contract](../api/README.md) and
[backend revalidation contract](../../../../middlewares/src/lib/revalidation/README.md).

## Session storage and lifetime

`addAction` writes a compact snapshot under the `global-actions-store`
`sessionStorage` key for debugging. The snapshot retains only recent events
and can replace large `props` or `result` values with truncation metadata.
Storage failures leave in-memory events available.

The store starts with an empty event log and does not read this snapshot back.
It does not restore React Query data or UI state after a page reload. Realtime
invalidation consumes the live in-memory log and does not depend on session
storage. `reset()` clears both the live log and the snapshot.

Use the model/relation SDK cache to render API data. Keep temporary UI state
with its owning component; persistent drafts or other state need an explicit
storage contract. The [frontend component contract](../../../../../.agents/contracts/engineering/frontend-components.md)
defines these responsibilities for implementation and code review.

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
