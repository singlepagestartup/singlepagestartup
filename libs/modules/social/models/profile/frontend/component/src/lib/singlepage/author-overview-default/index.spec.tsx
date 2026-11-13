/** @jest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import { api as profileApi } from "@sps/social/models/profile/sdk/client";
import { api as serverApi } from "@sps/social/models/profile/sdk/server";
import { Component as Overview } from ".";
import { Component as ServerReader } from "@sps/shared-frontend-components/singlepage/default/server";

jest.mock("server-only", () => ({}));
jest.mock(
  "@sps/social/models/profile/frontend/component/src/lib/singlepage/variants",
  () => ({
    variants: { "author-overview-default": jest.requireActual(".").Component },
  }),
);
jest.mock(
  "@sps/social/models/profile/frontend/component/src/lib/startup/variants",
  () => ({
    variants: {
      "chat-profile-avatar": ({ data }: { data: { id: string } }) => (
        <span data-testid="startup-avatar">{data.id}</span>
      ),
    },
  }),
);
jest.mock("@sps/social/models/profile/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: { findById: jest.fn(), authorFindById: jest.fn(), find: jest.fn() },
}));
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { findById: jest.fn(), authorFindById: jest.fn(), find: jest.fn() },
}));
jest.mock(
  "@sps/social/relations/profiles-to-blog-module-articles/frontend/component",
  () => ({
    Component: ({ children }: any) => children?.({ data: [] }),
  }),
);
jest.mock(
  "@sps/social/relations/profiles-to-ecommerce-module-products/frontend/component",
  () => ({
    Component: ({ children }: any) => children?.({ data: [] }),
  }),
);
jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/frontend/component",
  () => ({
    Component: ({ children }: any) => children?.({ data: [] }),
  }),
);
const profile = {
  id: "public-id",
  title: { en: "Framework editorial" },
  subtitle: {},
  description: {},
} as any;
const props = {
  isServer: false,
  language: "en",
  variant: "author-overview-default",
  profileId: profile.id,
} as const;
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(profileApi.findById)
    .mockReturnValue({ data: profile, isLoading: false } as any);
});
afterEach(cleanup);
it("loads the exact Profile model through the public variant and ordinary shared reader", () => {
  render(<Profile {...props} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Framework editorial",
  );
  expect(screen.getByTestId("startup-avatar").textContent).toBe(profile.id);
  expect(profileApi.findById).toHaveBeenCalledWith({ id: "public-id" });
  expect(profileApi.find).not.toHaveBeenCalled();
  expect(profileApi.authorFindById).not.toHaveBeenCalled();
});
it("uses the same exact-ID server SDK without leaking SDK bindings into view props", async () => {
  jest.mocked(serverApi.findById).mockResolvedValue(profile);
  const boundary = Overview({ ...props, isServer: true })!;
  const view = await ServerReader({
    ...boundary.props,
    api: boundary.props.serverApi,
  });
  expect(serverApi.findById).toHaveBeenCalledWith({ id: "public-id" });
  expect(view.props.data).toBe(profile);
  for (const field of [
    "api",
    "clientApi",
    "serverApi",
    "Provider",
    "Component",
  ])
    expect(view.props).not.toHaveProperty(field);
  expect(serverApi.authorFindById).not.toHaveBeenCalled();
});
it("keeps an already loaded model in props mode and avoids reads without an ID", () => {
  const view = render(<Profile {...props} dataSource="props" data={profile} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Framework editorial",
  );
  view.rerender(<Profile {...props} profileId="" />);
  expect(view.container.innerHTML).toBe("");
  expect(profileApi.findById).not.toHaveBeenCalled();
});
