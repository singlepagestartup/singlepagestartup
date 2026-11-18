/** @jest-environment jsdom */
import { render } from "@testing-library/react";
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: { languages: [] },
}));
jest.mock("@sps/shared-utils", () => ({
  saveLanguageContext: (href: string) => href,
}));
jest.mock("@sps/shared-ui-shadcn", () => {
  const Box = ({ children, ...props }: any) => <div {...props}>{children}</div>;
  return {
    Button: Box,
    Card: Box,
    CardContent: Box,
    CardFooter: Box,
    CardHeader: Box,
    CardTitle: Box,
    TipTap: () => null,
  };
});
jest.mock(
  "@sps/ecommerce/relations/stores-to-attributes/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () => ({
  Component: () => null,
}));
import { Component as Service } from "../service/Component";
import { Component as Delivery } from "../delivery/Component";

it.each([
  { variant: "service" as const, View: Service },
  { variant: "delivery" as const, View: Delivery },
])(
  "preserves the $variant root marker when sharing the default card",
  ({ variant, View }) => {
    const { container } = render(
      <View
        isServer={false}
        variant={variant as never}
        data={{ id: "store", slug: "example" } as any}
        language="en"
      />,
    );
    expect(container.firstElementChild?.tagName).toBe("A");
    expect(container.firstElementChild?.getAttribute("data-variant")).toBe(
      variant,
    );
  },
);
