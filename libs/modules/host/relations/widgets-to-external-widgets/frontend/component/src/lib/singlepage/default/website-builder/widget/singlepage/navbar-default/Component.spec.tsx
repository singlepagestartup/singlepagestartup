import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";
const mockSubject = jest.fn();
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockSubject(props);
    return null;
  },
}));
it("keeps the session cart client-side inside a cached server navbar", () => {
  renderToStaticMarkup(
    <Component
      isServer={true}
      language="en"
      url="/ecommerce"
      data={{ id: "navbar" } as any}
      variant="navbar-default"
    />,
  );
  expect(mockSubject).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: false,
      variant: "me-ecommerce-module-cart-default",
    }),
  );
});
