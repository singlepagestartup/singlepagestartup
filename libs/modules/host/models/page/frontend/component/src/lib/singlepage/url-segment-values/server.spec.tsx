import { renderToStaticMarkup } from "react-dom/server";
import { api } from "@sps/host/models/page/sdk/server";
import Server from "./server";

jest.mock("server-only", () => ({}));
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { findByUrl: jest.fn() },
}));

it.each([
  {
    "social.profiles.id": "p",
    "social.chats.id": "c",
    "social.threads.id": "t",
  },
  {},
])(
  "renders the complete server-resolved map without choosing individual segments: %j",
  async (routeParams) => {
    jest
      .mocked(api.findByUrl)
      .mockResolvedValue({ id: "page", routeParams } as any);
    const view = await Server({
      isServer: true,
      variant: "url-segment-values",
      url: "/project",
      children: ({ data }) => <output>{JSON.stringify(data)}</output>,
    });
    expect(renderToStaticMarkup(view)).toContain(
      renderToStaticMarkup(<output>{JSON.stringify(routeParams)}</output>),
    );
    expect(api.findByUrl).toHaveBeenLastCalledWith({
      url: "/project",
      catchErrors: true,
      silentErrorStatuses: [404],
    });
  },
);

it("passes an unresolved Page as undefined rather than fabricating IDs", async () => {
  jest.mocked(api.findByUrl).mockResolvedValue(undefined);
  const view = await Server({
    isServer: true,
    variant: "url-segment-values",
    url: "/missing",
    children: ({ data }) => <output>{data ? "resolved" : "missing"}</output>,
  });
  expect(renderToStaticMarkup(view)).toBe("<output>missing</output>");
});
