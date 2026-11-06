import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./index";
import Client from "./client";
import Server from "./server";

jest.mock("server-only", () => ({}));
jest.mock("client-only", () => ({}));
const mockClientRead = jest.fn();
const mockServerRead = jest.fn();
jest.mock("@sps/social/models/profile/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: { authorFind: (props: unknown) => mockClientRead(props) },
}));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { authorFind: (props: unknown) => mockServerRead(props) },
}));

const props = {
  isServer: false,
  variant: "chat-profile-avatar" as const,
  language: "en",
  data: { id: "profile", title: { en: "Jane" } },
};
beforeEach(() => jest.clearAllMocks());

it("scopes the public author read to this profile on both runtimes", async () => {
  const author = { avatar: null };
  mockClientRead.mockReturnValue({ data: [author] });
  mockServerRead.mockResolvedValue([author]);
  expect(renderToStaticMarkup(<Client {...props} />)).toContain("J");
  expect(
    renderToStaticMarkup(await Server({ ...props, isServer: true })),
  ).toContain("J");
  expect(mockClientRead).toHaveBeenCalledWith({
    params: { profileId: "profile" },
  });
  expect(mockServerRead).toHaveBeenCalledWith({
    params: { profileId: "profile" },
  });
});
it("uses a supplied scoped File result without a public lookup", () => {
  const html = renderToStaticMarkup(
    <Component {...props} file={null} fallback={<span>No avatar</span>} />,
  );
  expect(html).toContain("No avatar");
  expect(mockClientRead).not.toHaveBeenCalled();
  expect(mockServerRead).not.toHaveBeenCalled();
});
