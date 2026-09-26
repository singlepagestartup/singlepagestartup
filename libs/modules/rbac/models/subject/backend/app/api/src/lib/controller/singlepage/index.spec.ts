/**
 * BDD Suite: subject checkout route guards.
 *
 * Given: the subject controller's route table mounted the way the module app mounts it.
 * When: the order checkout and the product checkout of a subject are requested with and without a credential.
 * Then: a request without a credential or with another subject's token is refused before the checkout
 * handler runs, and the subject's own token or the operator secret reaches the handler.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
    RBAC_SECRET_KEY: "test-rbac-secret-key",
  };
});

import { sign } from "hono/jwt";
import { DefaultApp } from "@sps/shared-backend-api";
import { Controller } from ".";

const subjectId = "subject-owner";

const orderCheckout = {
  path: `/${subjectId}/ecommerce-module/orders/checkout`,
  data: {
    provider: "dummy",
    email: "owner@example.test",
    ecommerceModule: {
      orders: [{ id: "order-1" }],
    },
  },
};

const productCheckout = {
  path: `/${subjectId}/ecommerce-module/products/product-1/checkout`,
  data: {
    provider: "dummy",
    email: "owner@example.test",
    storeId: "store-1",
  },
};

/**
 * No subject row stands behind the id, so a request that reaches a checkout
 * handler stops at its first lookup with 404 and never calls another module.
 */
function createService() {
  return {
    findById: jest.fn().mockResolvedValue(null),
  };
}

function createApp(service: ReturnType<typeof createService>) {
  const app = new DefaultApp(
    {} as any,
    new Controller(service as any) as any,
    {} as any,
  );

  app.useRoutes();

  return app.hono;
}

async function requestCheckout(props: {
  route: typeof orderCheckout | typeof productCheckout;
  service: ReturnType<typeof createService>;
  tokenSubjectId?: string;
  operatorSecret?: string;
}) {
  const headers: Record<string, string> = {};

  if (props.tokenSubjectId) {
    const token = await sign(
      { subject: { id: props.tokenSubjectId } },
      "test-jwt-secret",
    );

    headers["Authorization"] = `Bearer ${token}`;
  }

  if (props.operatorSecret) {
    headers["X-RBAC-SECRET-KEY"] = props.operatorSecret;
  }

  const body = new FormData();
  body.append("data", JSON.stringify(props.route.data));

  return createApp(props.service).request(props.route.path, {
    method: "POST",
    headers,
    body,
  });
}

describe("Given: the order checkout route of a subject", () => {
  /**
   * BDD Scenario
   * Given: a request without a token or an operator secret.
   * When: the subject's order checkout is requested.
   * Then: it is refused and the checkout handler does not run.
   */
  it("When: no credential is sent Then: refuses the checkout before the handler", async () => {
    const service = createService();

    const response = await requestCheckout({ route: orderCheckout, service });

    expect(response.status).toBe(400);
    expect(service.findById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to another subject.
   * When: that subject requests the owner's order checkout.
   * Then: it is refused and the checkout handler does not run.
   */
  it("When: another subject's token is sent Then: refuses the checkout before the handler", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: orderCheckout,
      service,
      tokenSubjectId: "subject-other",
    });

    expect(response.status).toBe(401);
    expect(service.findById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to the subject in the path, as the browser cart sends it.
   * When: the subject requests its own order checkout.
   * Then: the checkout handler runs for that subject.
   */
  it("When: the subject's own token is sent Then: the checkout handler runs for the subject", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: orderCheckout,
      service,
      tokenSubjectId: subjectId,
    });

    expect(response.status).toBe(404);
    expect(service.findById).toHaveBeenCalledWith({ id: subjectId });
  });

  /**
   * BDD Scenario
   * Given: the operator secret in `X-RBAC-SECRET-KEY` and no token.
   * When: an operator process requests the subject's order checkout.
   * Then: the checkout handler runs for that subject.
   */
  it("When: the operator secret is sent Then: the checkout handler runs for the subject", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: orderCheckout,
      service,
      operatorSecret: "test-rbac-secret-key",
    });

    expect(response.status).toBe(404);
    expect(service.findById).toHaveBeenCalledWith({ id: subjectId });
  });
});

describe("Given: the product checkout route of a subject", () => {
  /**
   * BDD Scenario
   * Given: a request without a token or an operator secret.
   * When: the subject's product checkout is requested.
   * Then: it is refused and the checkout handler does not run.
   */
  it("When: no credential is sent Then: refuses the checkout before the handler", async () => {
    const service = createService();

    const response = await requestCheckout({ route: productCheckout, service });

    expect(response.status).toBe(400);
    expect(service.findById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to another subject.
   * When: that subject requests a product checkout for the owner.
   * Then: it is refused and the checkout handler does not run.
   */
  it("When: another subject's token is sent Then: refuses the checkout before the handler", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: productCheckout,
      service,
      tokenSubjectId: "subject-other",
    });

    expect(response.status).toBe(401);
    expect(service.findById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a token issued to the subject in the path, as the browser and the agent module send it.
   * When: the subject requests a product checkout for itself.
   * Then: the checkout handler runs for that subject.
   */
  it("When: the subject's own token is sent Then: the checkout handler runs for the subject", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: productCheckout,
      service,
      tokenSubjectId: subjectId,
    });

    expect(response.status).toBe(404);
    expect(service.findById).toHaveBeenCalledWith({ id: subjectId });
  });

  /**
   * BDD Scenario
   * Given: the operator secret in `X-RBAC-SECRET-KEY` and no token, as subscription renewal and
   * Telegram free-subscription provisioning send it.
   * When: an operator process requests a product checkout for the subject.
   * Then: the checkout handler runs for that subject.
   */
  it("When: the operator secret is sent Then: the checkout handler runs for the subject", async () => {
    const service = createService();

    const response = await requestCheckout({
      route: productCheckout,
      service,
      operatorSecret: "test-rbac-secret-key",
    });

    expect(response.status).toBe(404);
    expect(service.findById).toHaveBeenCalledWith({ id: subjectId });
  });
});
