/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: issue-152 frontend cart behavior with real API.
 *
 * Given: jsdom renders real module components and JWT cookie for a real subject.
 * When: user clicks Add to cart in the UI.
 * Then: visible cart badge is correct after reload and backend quantity endpoint confirms side effects.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    prepareFormDataToSend: ({ data }: { data: unknown }) => {
      const body = new URLSearchParams();
      body.set("data", JSON.stringify(data ?? {}));
      return body;
    },
  };
});

jest.mock("wagmi", () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
}));

jest.mock("@wagmi/core", () => ({
  disconnect: jest.fn(),
  signMessage: jest.fn(),
}));

jest.mock("@sps/shared-frontend-client-web3", () => ({
  ethereumVirtualMachine: {},
}));

jest.mock(
  "@sps/host/relations/widgets-to-external-widgets/frontend/component",
  () => {
    const { Component } = jest.requireActual(
      "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject",
    );

    return { Component };
  },
);

jest.mock("@sps/rbac/models/subject/frontend/component", () => {
  const { Component: AuthenticationMeDefault } = jest.requireActual(
    "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default",
  );
  const { Component: OrderListQuantityDefault } = jest.requireActual(
    "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/quantity-default",
  );

  return {
    Component: (props: any) => {
      if (props.variant === "authentication-me-default") {
        return <AuthenticationMeDefault {...props} />;
      }

      if (props.variant === "ecommerce-module-order-list-quantity-default") {
        return <OrderListQuantityDefault {...props} />;
      }

      if (props.variant === "ecommerce-module-order-list-checkout-default") {
        return null;
      }

      return null;
    },
  };
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Provider as ClientApiProvider,
  queryClient,
} from "@sps/shared-frontend-client-api";
import { Component as OrderCreateClientComponent } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent";
import { Component as HostModuleWidgetsToExternalWidgets } from "@sps/host/relations/widgets-to-external-widgets/frontend/component";
import { authenticateScenarioSubject } from "./test-utils/auth";
import {
  clearSubjectCartOrders,
  createCartScenarioFixtures,
  getCartQuantityRaw,
  type TCartScenarioFixtures,
} from "./test-utils/fixtures";

describe("Given: issue-152 frontend cart scenario", () => {
  const OrderCreate = OrderCreateClientComponent as any;
  const CartWidget = HostModuleWidgetsToExternalWidgets as any;

  let subjectId = "";
  let jwt = "";
  let fixtures: TCartScenarioFixtures | null = null;

  beforeAll(async () => {
    const auth = await authenticateScenarioSubject();
    subjectId = auth.id;
    jwt = auth.jwt;
    fixtures = await createCartScenarioFixtures();
  });

  beforeEach(async () => {
    await clearSubjectCartOrders({ subjectId, jwt });
    queryClient.clear();
    document.cookie = `rbac.subject.jwt=${jwt}; path=/`;
  });

  afterAll(async () => {
    await clearSubjectCartOrders({ subjectId, jwt });
    queryClient.clear();
    await fixtures?.cleanup();
  });

  it("When: user clicks Add to cart Then: cart badge reflects quantity after reload without cache-bust params", async () => {
    if (!fixtures) {
      throw new Error("Fixtures were not initialized");
    }
    const scenarioFixtures = fixtures;

    const renderScenario = () =>
      render(
        <ClientApiProvider>
          <>
            <OrderCreate
              variant="ecommerce-module-order-create-default"
              data={{ id: subjectId } as any}
              product={{ id: scenarioFixtures.productId } as any}
              store={{ id: scenarioFixtures.storeId } as any}
              billingModule={
                { currency: { id: scenarioFixtures.currencyId } } as any
              }
              language="en"
            />

            <div data-testid="cart-widget">
              <CartWidget
                isServer={false}
                variant="me-ecommerce-module-cart-default"
                language="en"
              />
            </div>
          </>
        </ClientApiProvider>,
      );

    const initialView = renderScenario();

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(async () => {
      const backendQuantity = await getCartQuantityRaw({
        subjectId,
        jwt,
      });

      expect(backendQuantity).toBe(1);
    });

    initialView.unmount();
    queryClient.clear();
    renderScenario();

    await waitFor(() => {
      const cartWidget = screen.getByTestId("cart-widget");
      expect(cartWidget.textContent).toContain("1");
    });

    const backendQuantity = await getCartQuantityRaw({
      subjectId,
      jwt,
    });

    expect(backendQuantity).toBe(1);
  });
});
