# Server API Factory

A factory utility for creating API clients in the SinglePageStartup (SPS) project. This library provides a standardized way to create API clients with predefined methods for common CRUD operations.

## Structure

```
src/
└── lib/
    └── factory/
        └── index.ts      # API factory implementation
```

## Implementation

The library exports a single factory function that creates an API client with the following methods:

- `findById`: Retrieve a single record by ID
- `find`: Search for records
- `update`: Update a record
- `create`: Create a new record
- `findOrCreate`: Find or create a record
- `delete`: Delete a record
- `bulkCreate`: Create multiple records
- `bulkUpdate`: Update multiple records

## Usage

```typescript
import { factory } from "@sps/shared/frontend/server/api";

// Create an API client
const api = factory<YourType>({
  route: "/api/your-endpoint",
  host: "https://api.example.com",
  params: {
    // Optional default params
  },
  options: {
    // Optional default options
  },
});

// Use the API client
const result = await api.findById({ id: "123" });
const items = await api.find();
const created = await api.create({
  data: {
    /* ... */
  },
});
```

## Type Safety

The factory is fully typed with TypeScript and supports:

- Generic type parameter for response data
- Type-safe parameters for each method
- Proper typing for options and parameters

## License

MIT
