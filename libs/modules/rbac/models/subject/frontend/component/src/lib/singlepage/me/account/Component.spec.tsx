import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./ClientComponent";
const mockSubject = jest.fn();
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockSubject(props);
    return null;
  },
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
beforeEach(() => mockSubject.mockClear());
it("uses the same account reader and menu as AI Chat within the client subtree", () => {
  renderToStaticMarkup(
    <Component
      variant="me-account"
      language="en"
      authenticated
      data={{ id: "owner" } as any}
    />,
  );
  expect(mockSubject).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "me-account-ai-chat",
      isServer: false,
      data: { id: "owner" },
    }),
  );
});
it.each([
  ["en", "Sign in", "/en/ai-chat/sign-in"],
  ["ru", "Войти", "/ru/ai-chat/sign-in"],
  [undefined, "Войти", "/ru/ai-chat/sign-in"],
])("localizes guest navigation for %s", (language, label, href) => {
  const html = renderToStaticMarkup(
    <Component
      variant="me-account"
      language={language}
      authenticated={false}
    />,
  );
  expect(html).toContain(`href="${href}"`);
  expect(html).toContain(label);
  expect(mockSubject).not.toHaveBeenCalled();
});
