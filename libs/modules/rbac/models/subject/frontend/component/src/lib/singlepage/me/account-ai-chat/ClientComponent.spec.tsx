/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
const selectProfile = jest.fn();
const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  selectSocialModuleProfile: (...args: unknown[]) => selectProfile(...args),
  api: {
    authenticationLogout: () => ({ isPending: false, mutate: jest.fn() }),
  },
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: ({ fallback }: any) => fallback,
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => <svg /> }));
import { Component } from "./ClientComponent";
const personal = {
  id: "personal",
  variant: "default",
  title: { en: "Personal" },
};
const assistant = {
  id: "assistant",
  variant: "artificial-intelligence",
  title: { en: "Studio" },
};
const props = {
  variant: "me-account-ai-chat",
  data: { id: "owner", slug: "owner" },
  language: "en",
  accountProfile: personal,
} as any;
beforeEach(() => {
  selectProfile.mockClear();
  push.mockClear();
});

it("hides the lower profile block for a single accessible profile", () => {
  render(<Component {...props} accountProfiles={[personal]} />);
  fireEvent.keyDown(screen.getByRole("button", { name: /account menu/ }), {
    key: "Enter",
  });
  expect(screen.queryByText("Profiles")).toBeNull();
});

it("switches an assistant profile below sign out and clears the old profile URL", () => {
  render(
    <Component
      {...props}
      socialModuleProfileId="personal"
      accountProfiles={[personal, assistant]}
    />,
  );
  fireEvent.keyDown(screen.getByRole("button", { name: /account menu/ }), {
    key: "Enter",
  });
  const item = screen.getByRole("menuitem", { name: "Studio" });
  const signOut = screen.getByRole("menuitem", { name: "Sign out" });
  expect(
    signOut.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  fireEvent.click(item);
  expect(selectProfile).toHaveBeenCalledWith("owner", "assistant");
  expect(push).toHaveBeenCalledWith("/en/ai-chat/projects");
});
