const repeatMock = jest.fn();
const addActionMock = jest.fn();
const toastErrorMock = jest.fn();
let capturedMutationOptions: any;

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: (options: unknown) => {
    capturedMutationOptions = options;
    return options;
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
  clientHost: "http://api.test",
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleOrderRepeat: (...args: unknown[]) => repeatMock(...args),
  },
}));

jest.mock("@sps/shared-frontend-client-api", () => ({
  queryClient: new (jest.requireActual("@tanstack/react-query").QueryClient)(),
}));

jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: {
    getState: () => ({
      addAction: (...args: unknown[]) => addActionMock(...args),
    }),
  },
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: (headers: object) => ({
    ...headers,
    Authorization: "Bearer session-token",
  }),
}));

jest.mock("@paralleldrive/cuid2", () => ({
  createId: () => "request-id",
}));

jest.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

import { queryClient } from "@sps/shared-frontend-client-api";
import { action } from "./repeat";

describe("repeat order mutation", () => {
  const path = "/api/rbac/subjects/subject-1/ecommerce-module/orders";
  const cartA = [
    path,
    "socialModuleProfileId=profile-A&includeCartDetails=true",
  ];
  const historyA = [
    path,
    "includePurchaseDetails=true&socialModuleProfileId=profile-A",
  ];
  const linesA = [
    "/api/rbac/subjects/subject-1/ecommerce-module/orders-to-products",
    "socialModuleProfileId=profile-A",
  ];
  const cartB = [path, "socialModuleProfileId=profile-B"];
  const otherSubject = [
    "/api/rbac/subjects/subject-2/ecommerce-module/orders",
    "socialModuleProfileId=profile-A",
  ];
  const unscoped = [path, ""];

  beforeEach(() => {
    jest.clearAllMocks();
    repeatMock.mockReset();
    queryClient.clear();
    capturedMutationOptions = undefined;
    for (const key of [
      cartA,
      historyA,
      linesA,
      cartB,
      otherSubject,
      unscoped,
    ]) {
      queryClient.setQueryData(key, [{ id: key[1] }]);
    }
  });

  afterAll(() => {
    queryClient.clear();
  });

  it("reconciles only the supplied subject and profile before the consumer callback", async () => {
    const result = { orderIds: ["new-cart-1"] };
    repeatMock.mockResolvedValue(result);
    const onSuccess = jest.fn(async () => {
      expect(queryClient.getQueryState(cartA)?.isInvalidated).toBe(true);
      expect(addActionMock).toHaveBeenCalledTimes(1);
    });
    const variables = {
      id: "subject-1",
      orderId: "purchase-1",
      params: { socialModuleProfileId: "profile-A" },
      options: { headers: { "X-Request": "repeat" } },
    };
    const onMutateResult = { previous: "cart" };
    const context = { client: queryClient };

    action({ reactQueryOptions: { onSuccess } });
    await expect(
      capturedMutationOptions.mutationFn(variables),
    ).resolves.toEqual(result);
    await capturedMutationOptions.onSuccess(
      result,
      variables,
      onMutateResult,
      context,
    );

    expect(repeatMock).toHaveBeenCalledWith({
      ...variables,
      host: "http://api.test",
      options: {
        headers: {
          "X-Request": "repeat",
          Authorization: "Bearer session-token",
        },
      },
    });
    for (const key of [cartA, historyA, linesA]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of [cartB, otherSubject, unscoped]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
    expect(onSuccess).toHaveBeenCalledWith(
      result,
      variables,
      onMutateResult,
      context,
    );
    expect(addActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "mutation",
        props: {
          id: "subject-1",
          orderId: "purchase-1",
          params: { socialModuleProfileId: "profile-A" },
        },
        result,
      }),
    );
  });

  it("retains the original target if selection inputs change while the request is pending", async () => {
    let finishRepeat!: (result: { orderIds: string[] }) => void;
    repeatMock.mockImplementation(
      () => new Promise((resolve) => (finishRepeat = resolve)),
    );
    const variables = {
      id: "subject-1",
      orderId: "purchase-A",
      params: { socialModuleProfileId: "profile-A" },
    };

    action();
    const pending = capturedMutationOptions.mutationFn(variables);
    variables.id = "subject-2";
    variables.orderId = "purchase-B";
    variables.params.socialModuleProfileId = "profile-B";
    finishRepeat({ orderIds: ["new-cart-A"] });
    await pending;

    expect(repeatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject-1",
        orderId: "purchase-A",
        params: { socialModuleProfileId: "profile-A" },
      }),
    );
    expect(queryClient.getQueryState(cartA)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(cartB)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(otherSubject)?.isInvalidated).toBe(false);
    expect(addActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          id: "subject-1",
          orderId: "purchase-A",
          params: { socialModuleProfileId: "profile-A" },
        },
      }),
    );
  });

  it("requires an explicit profile without creating or selecting another profile", async () => {
    action();

    await expect(
      capturedMutationOptions.mutationFn({
        id: "subject-1",
        orderId: "purchase-1",
        params: {},
      }),
    ).rejects.toThrow("Validation error. socialModuleProfileId is required");

    expect(repeatMock).not.toHaveBeenCalled();
    expect(addActionMock).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(cartA)?.isInvalidated).toBe(false);
  });

  it("keeps the current cached cart when repeat is rejected", async () => {
    const error = new Error("Validation error. Product is unavailable");
    repeatMock.mockRejectedValue(error);
    const previous = queryClient.getQueryData(cartA);
    action();

    await expect(
      capturedMutationOptions.mutationFn({
        id: "subject-1",
        orderId: "purchase-1",
        params: { socialModuleProfileId: "profile-A" },
      }),
    ).rejects.toBe(error);

    expect(queryClient.getQueryData(cartA)).toBe(previous);
    expect(queryClient.getQueryState(cartA)?.isInvalidated).toBe(false);
    expect(addActionMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(error.message);
  });
});
