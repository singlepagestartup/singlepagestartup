import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";

export function Component() {
  return (
    <div role="status" aria-label="Loading token catalogue">
      <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((id) => (
          <Product key={id} isServer={false} variant="loading" />
        ))}
      </div>
    </div>
  );
}
