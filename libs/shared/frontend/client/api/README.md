# Client API

A library for managing API requests in the SinglePageStartup (SPS) application. Built on top of TanStack Query (React Query) and provides a factory pattern for creating API clients with built-in caching, error handling, and request tracking.

## Why This Approach

- Factory-based SDK hooks keep query keys and request behavior consistent across all modules.
- Revalidation is centralized in one subscription pipeline instead of ad-hoc invalidation in components.
- Hybrid invalidation (topics + route fallback) allows gradual migration:
  - new flows can use precise topic tags,
  - legacy flows continue to work through route matching.
- Segment-boundary route matching prevents false positives between similarly named endpoints.

## Structure

```
src/
├── lib/
│   ├── factory/          # API client factory
│   │   ├── mutations/    # Mutation operations
│   │   ├── queries/      # Query operations
│   │   └── index.ts      # Factory implementation
│   ├── provider/         # React Query provider
│   └── request-limmiter/ # Request rate limiting
```

## Core Components

### Factory

The factory creates API clients with built-in operations. Here's how it's used in the project:

```typescript
// Example from libs/modules/website-builder/models/button/sdk/client/src/lib/singlepage.ts
"use client";

import { IModel, route, clientHost, query, options } from "@sps/website-builder/models/button/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  params: query,
  options,
});
```

### Request Limiter

Rate limiting for API requests:

```typescript
import { requestLimiter } from "@sps/shared-frontend-client-api";

// Configure rate limiting
requestLimiter.configure({
  maxRequests: 100,
  timeWindow: 1000 * 60, // 1 minute
});
```

## Features

- Built on TanStack Query for efficient caching and state management
- Automatic request tracking and logging
- Rate limiting support
- Type-safe API operations
- Built-in error handling
- Configurable stale time and caching
- Support for both REST and GraphQL operations
- Automatic request deduplication
- Request/response interceptors
- Cross-tab synchronization

## Notes

- All requests are automatically tracked in the global actions store
- Supports both client-side and server-side rendering
- Includes built-in retry logic for failed requests
- Provides hooks for loading and error states
- Supports custom headers and authentication

## Revalidation Contract

Realtime invalidation contract (WebSocket + React Query) is documented in:

- `libs/middlewares/src/lib/revalidation/README.md`

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
