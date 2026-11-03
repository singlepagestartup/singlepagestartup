/**
 * BDD Suite: optional output schema on REST handlers.
 *
 * Given: a model configuration with and without repository.outputSchema.
 * When: the find handler serialises repository rows.
 * Then: a configured schema filters the response and an unconfigured model is unchanged.
 */

import { z } from "zod";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { Handler } from ".";
import { Handler as CountHandler } from "../count";
import { Handler as FindByIdHandler } from "../find-by-id";

const rows = [
  { id: "row-1", email: "one@example.com", secret: "hash-1" },
  { id: "row-2", email: "two@example.com", secret: "hash-2" },
];

function createService(outputSchema?: z.ZodObject<any>) {
  return {
    find: jest.fn().mockResolvedValue(rows),
    repository: outputSchema
      ? {
          configuration: {
            repository: { outputSchema },
          },
        }
      : {},
  } as any;
}

function createContext(props?: { privileged?: boolean }) {
  const json = jest.fn((payload) => {
    return new Response(JSON.stringify(payload));
  });

  return {
    var: { parsedQuery: { limit: 10 } },
    get: jest.fn((key: string) => {
      return key === RBAC_PRIVILEGED_CONTEXT_KEY
        ? Boolean(props?.privileged)
        : undefined;
    }),
    json,
  } as any;
}

describe("Given: a model served through the shared find handler", () => {
  it("returns hidden variants as ordinary data and forwards only the caller's filters", async () => {
    const data = [
      { id: "one", variant: "hidden" },
      { id: "two", variant: "default" },
    ];
    const service = createService();
    service.repository.configuration = {
      repository: { Table: { variant: {} } },
    };
    service.find.mockResolvedValue(data);
    const context = createContext();
    context.var.parsedQuery = {
      limit: 10,
      filters: { and: [{ column: "variant", method: "eq", value: "hidden" }] },
    };
    await new Handler(service).execute(context, jest.fn() as any);
    expect(service.find).toHaveBeenCalledWith({
      params: context.var.parsedQuery,
    });
    expect(context.json).toHaveBeenCalledWith({ data });
  });

  it("does not turn a hidden variant into a missing record", async () => {
    const data = { id: "one", variant: "hidden" };
    const service = createService();
    service.findById = jest.fn().mockResolvedValue(data);
    const context = createContext();
    context.req = { param: () => data.id };
    await new FindByIdHandler(service).execute(context, jest.fn() as any);
    expect(context.json).toHaveBeenCalledWith({ data });
  });

  it("counts the requested collection without injecting a variant predicate", async () => {
    const service = createService();
    service.repository.configuration = {
      repository: { Table: { variant: {} } },
    };
    service.count = jest.fn().mockResolvedValue(2);
    const context = createContext();
    await new CountHandler(service).execute(context, jest.fn() as any);
    expect(service.count).toHaveBeenCalledWith({
      params: context.var.parsedQuery,
    });
    expect(context.json).toHaveBeenCalledWith({ data: 2 });
  });
  /**
   * BDD Scenario
   * Given: a model that configures no output schema.
   * When: the find handler answers.
   * Then: the repository rows are returned verbatim.
   */
  it("When: no output schema is configured Then: returns the rows unchanged", async () => {
    const service = createService();
    const context = createContext();

    await new Handler(service).execute(context, jest.fn() as any);

    expect(context.json).toHaveBeenCalledWith({ data: rows });
    expect(service.find).toHaveBeenCalledWith({
      params: context.var.parsedQuery,
    });
  });

  /**
   * BDD Scenario
   * Given: a model that configures an output schema omitting a column.
   * When: an unprivileged caller reads the collection.
   * Then: the omitted column is absent from every row.
   */
  it("When: an output schema is configured Then: drops the omitted column", async () => {
    const outputSchema = z.object({ id: z.string(), email: z.string() });
    const context = createContext();

    await new Handler(createService(outputSchema)).execute(
      context,
      jest.fn() as any,
    );

    expect(context.json).toHaveBeenCalledWith({
      data: [
        { id: "row-1", email: "one@example.com" },
        { id: "row-2", email: "two@example.com" },
      ],
    });
  });

  /**
   * BDD Scenario
   * Given: the same model and the operator secret key on the request.
   * When: the find handler answers.
   * Then: the full row is returned, because internal flows read it back.
   */
  it("When: the caller is privileged Then: keeps every column", async () => {
    const outputSchema = z.object({ id: z.string(), email: z.string() });
    const context = createContext({ privileged: true });

    await new Handler(createService(outputSchema)).execute(
      context,
      jest.fn() as any,
    );

    expect(context.json).toHaveBeenCalledWith({ data: rows });
  });
});
