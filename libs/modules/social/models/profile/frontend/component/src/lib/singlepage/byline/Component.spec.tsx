/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Component as Byline } from "./Component";
import { Component as AuthorRelation } from "../../../../../../../../relations/profiles-to-blog-module-articles/frontend/component/src/lib/singlepage/author-default/Component";
const mockReads = jest.fn();
const mockTipTap = jest.fn((_props: unknown) => null);
const mockProfile = {
  id: "profile-a",
  slug: "editorial",
  title: { en: "SPS editorial", ru: "Редакция SPS" },
  subtitle: { en: "Stored role" },
};
jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: (props: unknown) => mockTipTap(props),
}));
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  BylineSkeleton: () => <div data-variant="byline-loading" />,
  Component: (props: any) => {
    mockReads(props);
    if (props.variant === "chat-profile-avatar") {
      return <img src="/stored-avatar.png" alt="Stored avatar" />;
    }
    return <span data-testid="profile-view" />;
  },
}));
beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());
it.each([true, false])(
  "renders saved profile name/avatar and scopes its media query in runtime %s",
  (isServer) => {
    const { container } = render(
      <Byline
        isServer={isServer}
        variant="byline"
        data={mockProfile as any}
        language="ru"
        size="sm"
        inverse
      />,
    );
    expect(screen.getByText("Редакция SPS")).toBeVisible();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/stored-avatar.png",
    );
    expect(screen.getByText("Stored role")).toBeVisible();
    const query = mockReads.mock.calls[0][0];
    expect(query.isServer).toBe(isServer);
    expect(query.variant).toBe("chat-profile-avatar");
    expect(query.data.id).toBe("profile-a");
    expect(screen.getByText("Редакция SPS")).toHaveClass(
      "text-default-foreground",
    );
  },
);
it.each([
  ["en", "plain"],
  ["ru", "plain"],
  ["en", "legacy"],
  ["ru", "legacy"],
] as const)(
  "renders %s %s stored subtitles as plain paragraphs without TipTap or diagnostics",
  (language, format) => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const labels = { en: "Stored English role", ru: "Сохранённая должность" };
    const legacy = (text: string) =>
      JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      });
    const subtitle = Object.fromEntries(
      Object.entries(labels).map(([locale, label]) => [
        locale,
        format === "legacy" ? legacy(label) : label,
      ]),
    );
    const { container } = render(
      <Byline
        isServer={false}
        variant="byline"
        data={{ ...mockProfile, subtitle } as any}
        language={language}
        size="sm"
      />,
    );
    expect(screen.getByText(labels[language]).tagName).toBe("P");
    expect(screen.getByText(labels[language])).toHaveClass(
      "text-xs",
      "leading-5",
      "text-muted-foreground",
    );
    expect(container.textContent).not.toContain('"type":"doc"');
    expect(mockTipTap).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  },
);
it.each([true, false])(
  "author association passes the linked Profile ID and display props to the byline in runtime %s",
  (isServer) => {
    render(
      <AuthorRelation
        isServer={isServer}
        variant="author-default"
        data={
          {
            id: "author-link",
            profileId: "profile-a",
            blogModuleArticleId: "article-a",
          } as any
        }
        language="ru"
        size="xs"
      />,
    );
    expect(mockReads).toHaveBeenCalledWith(
      expect.objectContaining({
        isServer,
        variant: "author-byline-default",
        profileId: "profile-a",
        language: "ru",
        size: "xs",
      }),
    );
    expect(screen.getByTestId("profile-view")).toBeVisible();
  },
);
