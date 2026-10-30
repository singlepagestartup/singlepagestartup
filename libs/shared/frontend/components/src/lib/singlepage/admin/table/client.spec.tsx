/** @jest-environment jsdom */
import { render } from "@testing-library/react";
import { Component } from "./client";

jest.mock("client-only", () => ({}), { virtual: true });
const mockContext = jest.fn();
jest.mock("../table-controller/Context", () => ({
  useTableContext: () => mockContext(),
}));

describe("parent-scoped administrative relation counts", () => {
  it.each([0, 2])(
    "uses the parent filter for rows and total %s, without pagination in count",
    (total) => {
      const setState = jest.fn();
      mockContext.mockReturnValue({ offset: 100, limit: 100, setState });
      const count = jest.fn(() => ({ data: total }));
      const find = jest.fn(() => ({ data: [], isLoading: false }));
      const filters = {
        and: [{ column: "pageId", method: "eq", value: "page-1" }],
      };
      render(
        <Component
          isServer={false}
          variant="admin-table"
          api={{ count, find } as any}
          apiProps={{
            params: { filters },
            options: { headers: { Authorization: "session" } },
          }}
          Component={() => <div />}
        />,
      );
      expect(count).toHaveBeenCalledWith({
        params: { filters, includeHidden: "1" },
        options: {
          headers: { Authorization: "session", "Cache-Control": "no-store" },
        },
      });
      expect(find).toHaveBeenCalledWith({
        params: { filters, includeHidden: "1", offset: 100, limit: 100 },
        options: {
          headers: { Authorization: "session", "Cache-Control": "no-store" },
        },
      });
      expect(setState.mock.calls.at(-1)[0]({ total: 7 })).toMatchObject({
        total,
      });
    },
  );
});
