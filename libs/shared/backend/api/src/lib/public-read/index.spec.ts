import { publicReadParams, assertPublicRecord } from "./index";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
const service = {
  repository: { configuration: { repository: { Table: { variant: {} } } } },
} as any;
function context({
  operator = false,
  editor = false,
  publicOnly = false,
} = {}) {
  return {
    get: (key: string) =>
      key === RBAC_PRIVILEGED_CONTEXT_KEY
        ? operator
        : key === "sps.includeHidden"
          ? editor
          : undefined,
    req: { query: () => (publicOnly ? "1" : undefined) },
  } as any;
}
it("applies visibility before find/count pagination without losing the existing constraints", () => {
  const params = {
    limit: 10,
    offset: 20,
    filters: { and: [{ column: "slug", method: "eq", value: "example" }] },
  };
  expect(publicReadParams(context(), service, params)).toEqual({
    ...params,
    filters: {
      and: [
        ...params.filters.and,
        { column: "variant", method: "ne", value: "hidden" },
      ],
    },
  });
});
it("preserves authorized administrative/internal reads but not explicit public reads", () => {
  const params = { limit: 10 };
  expect(publicReadParams(context({ operator: true }), service, params)).toBe(
    params,
  );
  expect(publicReadParams(context({ editor: true }), service, params)).toBe(
    params,
  );
  expect(
    publicReadParams(
      context({ operator: true, publicOnly: true }),
      service,
      params,
    )?.filters?.and,
  ).toContainEqual({ column: "variant", method: "ne", value: "hidden" });
});
it("returns 404 for hidden individual records only at the public boundary", () => {
  expect(() => assertPublicRecord(context(), { variant: "hidden" })).toThrow(
    "Not Found",
  );
  expect(() =>
    assertPublicRecord(context({ operator: true }), { variant: "hidden" }),
  ).not.toThrow();
  expect(() =>
    assertPublicRecord(context({ operator: true, publicOnly: true }), {
      variant: "hidden",
    }),
  ).toThrow("Not Found");
});
