import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
export function Component() {
  return (
    <div role="status" aria-label="Loading categories">
      <div
        aria-hidden="true"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((id) => (
          <Category key={id} isServer={false} variant="loading" />
        ))}
      </div>
    </div>
  );
}
