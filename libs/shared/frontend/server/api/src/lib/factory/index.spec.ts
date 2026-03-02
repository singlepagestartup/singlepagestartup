jest.mock("@sps/shared-frontend-api", () => ({
  actions: {
    findById: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findOrCreate: jest.fn(),
    bulkCreate: jest.fn(),
    bulkUpdate: jest.fn(),
  },
}));

import { actions } from "@sps/shared-frontend-api";
import { factory } from "./index";

describe("server api factory", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards route/host/default params and options to find", async () => {
    const findMock = actions.find as jest.Mock;
    findMock.mockResolvedValue([{ id: "1" }]);

    const api = factory({
      route: "/api/ecommerce/products",
      host: "http://localhost:3000",
      params: { limit: 10 },
      options: { headers: { "X-Test": "1" } },
    });

    await api.find();

    expect(findMock).toHaveBeenCalledWith({
      route: "/api/ecommerce/products",
      host: "http://localhost:3000",
      params: { limit: 10 },
      options: { headers: { "X-Test": "1" } },
    });
  });

  it("allows method-level params/options override for findById", async () => {
    const findByIdMock = actions.findById as jest.Mock;
    findByIdMock.mockResolvedValue({ id: "entity-id" });

    const api = factory({
      route: "/api/ecommerce/attributes",
      host: "http://localhost:3000",
      params: { limit: 10 },
      options: { headers: { "X-Test": "1" } },
    });

    await api.findById({
      id: "entity-id",
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "x" }] },
      },
      options: { headers: { "X-Request": "abc" } },
    });

    expect(findByIdMock).toHaveBeenCalledWith({
      route: "/api/ecommerce/attributes",
      host: "http://localhost:3000",
      id: "entity-id",
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "x" }] },
      },
      options: { headers: { "X-Request": "abc" } },
    });
  });

  it("routes mutation helpers to corresponding actions", async () => {
    const createMock = actions.create as jest.Mock;
    const updateMock = actions.update as jest.Mock;
    const deleteMock = actions.delete as jest.Mock;
    const findOrCreateMock = actions.findOrCreate as jest.Mock;
    const bulkCreateMock = actions.bulkCreate as jest.Mock;
    const bulkUpdateMock = actions.bulkUpdate as jest.Mock;

    const api = factory({
      route: "/api/ecommerce/products-to-attributes",
      host: "http://localhost:3000",
    });

    await api.create({ data: { productId: "p1" } });
    await api.update({ id: "rel-1", data: { attributeId: "a1" } });
    await api.delete({ id: "rel-1" });
    await api.findOrCreate({ data: { productId: "p1", attributeId: "a1" } });
    await api.bulkCreate({ data: [{ productId: "p1", attributeId: "a1" }] });
    await api.bulkUpdate({ data: [{ productId: "p1", attributeId: "a1" }] });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(findOrCreateMock).toHaveBeenCalledTimes(1);
    expect(bulkCreateMock).toHaveBeenCalledTimes(1);
    expect(bulkUpdateMock).toHaveBeenCalledTimes(1);
  });
});
