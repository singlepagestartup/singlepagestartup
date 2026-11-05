import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
export function Component() {
  return (
    <div role="status" aria-label="Loading products">
      <div
        aria-hidden="true"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[0, 1, 2].map((id) => (
          <Product key={id} isServer={false} variant="loading" />
        ))}
      </div>
    </div>
  );
}
