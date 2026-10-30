import { api } from "./index";
import { useQuery } from "@tanstack/react-query";
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((options) => options),
}));
jest.mock("@sps/shared-frontend-client-api", () => ({
  factory: () => ({}),
  queryClient: {},
  Provider: () => null,
}));
jest.mock("@sps/shared-utils", () => ({
  responsePipe: async ({ res }: { res: Response }) => {
    if (!res.ok) throw new Error("Preview failed");
    return res.json();
  },
  transformResponseItem: (result: { data: unknown }) => result.data,
}));
describe("Metadata client preview transport", () => {
  const fetcher = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetcher;
  });
  it("calls Metadata API with unsaved form values and unwraps its data envelope", async () => {
    const draft = {
      url: "/blog/one",
      language: "ru",
      metadata: { title: "Draft" },
    };
    api.preview(draft);
    const options = jest.mocked(useQuery).mock.calls[0][0] as any;
    expect(options.enabled).toBe(false);
    expect(options.gcTime).toBe(0);
    fetcher.mockResolvedValue(
      Response.json({
        data: { metadata: { title: "Resolved" }, structuredData: [] },
      }),
    );
    expect(await options.queryFn()).toEqual({
      metadata: { title: "Resolved" },
      structuredData: [],
    });
    expect(fetcher.mock.calls[0][0]).toMatch(/\/api\/host\/metadata\/preview$/);
    expect(fetcher.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(draft),
        cache: "no-store",
      }),
    );
  });
});
