# Shared Utils

A library of common utilities for the SinglePageStartup (SPS) project. Contains a set of reusable functions and constants used across various project modules.

## Structure

```
src/
├── lib/
│   ├── constants/         # Common constants
│   ├── envs/             # Environment variables utilities
│   ├── get-nested-value/ # Nested value access functions
│   ├── hash/             # Hashing functions
│   ├── limited-parallel-execution/ # Limited parallel execution
│   ├── parse-mime-type/  # MIME type parsing
│   ├── random-words-generator/ # Random words generator
│   ├── shortener-by-symbols/ # Text shortening by symbols
│   ├── types/            # Common types
│   ├── build-tree-paths/ # Tree path building
│   ├── response-pipe.ts  # Response processing pipe pattern
│   ├── transform-response-item.ts # Response item transformation
│   ├── preapare-form-data-to-send.ts # FormData preparation for sending
│   ├── authorization/    # Authorization utilities
│   └── saturate-headers/ # Headers processing utilities
```

## Core Functions

### Authorization and Headers

- `authorization.headers()` - Get authorization headers from cookies
- `saturateHeaders()` - Merge user headers with authorization headers

### Response Processing

- `responsePipe` - Pipe pattern for sequential response processing
- `transformResponseItem` - Response item transformation

### Data Handling

- `getNestedValue` - Access nested values in objects
- `buildTreePaths` - Build paths in tree structure
- `prepareFormDataToSend` - Prepare FormData for server submission

### Generation and Processing

- `randomWordsGenerator` - Random words generation
- `shortenerBySymbols` - Text shortening by symbols
- `hash` - Hashing functions

### Types and Constants

- Common types for the entire project
- Constants for various modules
- Environment variables utilities

## Usage

```typescript
import { responsePipe, getNestedValue, authorization, saturateHeaders } from "@sps/shared/utils";

// Example of authorization headers usage
const headers = authorization.headers();

// Example of saturate headers usage
const saturatedHeaders = saturateHeaders({ "Content-Type": "application/json" });

// Example of responsePipe usage
const result = await responsePipe(data).pipe(transformResponseItem).pipe(anotherTransform).execute();

// Example of getNestedValue usage
const value = getNestedValue(obj, "path.to.value");
```

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
