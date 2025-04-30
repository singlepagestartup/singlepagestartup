# Frontend API Library

A library for working with API in SinglePageStartup frontend applications.

## Description

The library provides a set of typed actions for API interaction. All actions are implemented with TypeScript support and follow a unified usage pattern.

## Installation

```bash
npm install @sps/shared/frontend/api
```

## Usage

### Importing Actions

```typescript
import { actions } from "@sps/shared/frontend/api";
```

### Available Actions

- `create` - create a new record
- `delete` - delete a record
- `find` - find records
- `findById` - find a record by ID
- `update` - update a record
- `findOrCreate` - find or create a record
- `bulkCreate` - bulk create records
- `bulkUpdate` - bulk update records

### Data Types

```typescript
import type { ICreateProps, IDeleteProps, IFindProps, IFindByIdProps, IUpdateProps, IFindOrCreateProps, IBulkCreateProps, IBulkUpdateProps } from "@sps/shared/frontend/api";
```

## Usage Examples

### Creating a Record

```typescript
const result = await actions.create({
  model: "user",
  data: {
    name: "John Doe",
    email: "john@example.com",
  },
});
```

### Finding Records

```typescript
const result = await actions.find({
  model: "user",
  where: {
    email: "john@example.com",
  },
});
```

### Updating a Record

```typescript
const result = await actions.update({
  model: "user",
  id: "123",
  data: {
    name: "John Smith",
  },
});
```

## Notes

- All actions return a Promise
- Strict typing is supported for both input and output data
- Actions automatically handle errors and return typed results
