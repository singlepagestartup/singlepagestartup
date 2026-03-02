const responsePipeMock = jest.fn();
const transformResponseItemMock = jest.fn();
const prepareFormDataToSendMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  responsePipe: (...args: unknown[]) => responsePipeMock(...args),
  transformResponseItem: (...args: unknown[]) =>
    transformResponseItemMock(...args),
  prepareFormDataToSend: (...args: unknown[]) =>
    prepareFormDataToSendMock(...args),
}));

import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { action as findAction } from "./find";
import { action as findByIdAction } from "./find-by-id";
import { action as createAction } from "./create";
import { action as bulkUpdateAction } from "./bulk-update";

describe("shared frontend api actions", () => {
  const originalNextPhase = process.env.NEXT_PHASE;
  const fetchMock = jest.fn();

  beforeEach(() => {
    (global as any).fetch = fetchMock;

    fetchMock.mockResolvedValue({ ok: true } as Response);
    responsePipeMock.mockResolvedValue({ data: { id: "entity-id" } });
    transformResponseItemMock.mockReturnValue({ id: "entity-id" });
    prepareFormDataToSendMock.mockReturnValue("FORM_DATA");

    process.env.NEXT_PHASE = "";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NEXT_PHASE = originalNextPhase;
  });

  it("find builds list request with query params and route tags", async () => {
    await findAction({
      host: "http://localhost:3000",
      route: "/api/ecommerce/products",
      params: { limit: 5 },
      options: {
        headers: {
          "X-Test": "1",
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ecommerce/products?limit=5",
      expect.objectContaining({
        credentials: "include",
        headers: { "X-Test": "1" },
        next: { tags: ["/api/ecommerce/products"] },
      }),
    );

    expect(responsePipeMock).toHaveBeenCalledWith({
      res: expect.any(Object),
      catchErrors: false,
    });
    expect(transformResponseItemMock).toHaveBeenCalledWith({
      data: { id: "entity-id" },
    });
  });

  it("findById uses no-store cache header during production build", async () => {
    process.env.NEXT_PHASE = PHASE_PRODUCTION_BUILD;

    await findByIdAction({
      host: "http://localhost:3000",
      route: "/api/ecommerce/products",
      id: "product-1",
      params: {},
      options: {
        headers: {
          "X-Test": "1",
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ecommerce/products/product-1?",
      expect.objectContaining({
        credentials: "include",
        headers: {
          "Cache-Control": "no-store",
          "X-Test": "1",
        },
        next: { tags: ["/api/ecommerce/products/product-1"] },
      }),
    );
  });

  it("create sends form-data payload via POST", async () => {
    await createAction({
      host: "http://localhost:3000",
      route: "/api/ecommerce/attributes",
      data: { title: "Color" },
      params: {},
    });

    expect(prepareFormDataToSendMock).toHaveBeenCalledWith({
      data: { title: "Color" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ecommerce/attributes?",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
        body: "FORM_DATA",
      }),
    );
  });

  it("bulkUpdate sends patch request to /bulk endpoint", async () => {
    await bulkUpdateAction({
      host: "http://localhost:3000",
      route: "/api/ecommerce/products-to-attributes",
      data: [{ productId: "p1", attributeId: "a1" }],
      params: {},
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ecommerce/products-to-attributes/bulk?",
      expect.objectContaining({
        credentials: "include",
        method: "PATCH",
        body: "FORM_DATA",
      }),
    );
  });
});
