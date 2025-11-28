# Shared Frontend Components

A library of reusable components for the SinglePageStartup (SPS) project. Contains base components and abstractions used in the admin panel and other parts of the application.

## Structure

```
src/
└── lib/
    └── singlepage/           # Core SPS components
        ├── admin/            # Admin panel components
        │   ├── form/         # Forms
        │   ├── agregated-input/ # Aggregated input fields
        │   ├── table/        # Tables
        │   ├── table-row/    # Table rows
        │   ├── select-input/ # Select fields
        │   └── panel/        # Panels
        ├── subject-default/  # Default components
        ├── find/             # Search components
        ├── default/          # Base components
        ├── errors/           # Error components
        └── skeletons/        # Skeleton components
```

## Purpose

The library provides:

1. **Admin Panel Abstractions**:

   - Unified forms
   - Standardized tables
   - Common input components
   - Control panels

2. **Base Components**:
   - Default components
   - Search components
   - Error handling
   - Skeleton loading

## Usage

```typescript
import {
  AdminForm,
  AdminTable,
  AdminPanel
} from "@sps/shared/frontend/components";

// Form usage example
<AdminForm
  onSubmit={handleSubmit}
  initialValues={initialData}
>
  {/* Form fields */}
</AdminForm>

// Table usage example
<AdminTable
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
/>

// Panel usage example
<AdminPanel
  title="Management"
  actions={actions}
>
  {/* Panel content */}
</AdminPanel>
```

## Features

1. **Implementation Abstraction**:

   - Hidden internal logic
   - Unified interface for different implementations
   - Ease of use

2. **Reusability**:

   - Code duplication minimization
   - Interface standardization
   - UI consistency

3. **Extensibility**:
   - Ability to add new components
   - Base functionality inheritance
   - Existing components customization

## License

MIT
