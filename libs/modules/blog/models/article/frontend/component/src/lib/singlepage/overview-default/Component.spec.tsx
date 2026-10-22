import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";
const mockWidgetLinks = jest.fn();
jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value }: any) => <div>{value}</div>,
}));
jest.mock(
  "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (p: any) =>
      p.variant === "find" ? (
        p.children({ data: [{ id: "media-a" }, { id: "media-b" }] })
      ) : (
        <div>{p.data.id}</div>
      ),
  }),
);
jest.mock(
  "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component",
  () => ({
    Component: (p: any) => {
      mockWidgetLinks(p);
      return p.variant === "find" ? p.children({ data: [] }) : null;
    },
  }),
);
it("retains public rich header/body and all media while using the supplied ordered JSX instead of a second unscoped read", () => {
  const html = renderToStaticMarkup(
    <Component
      isServer={true}
      variant="overview-default"
      language="ru"
      data={
        {
          id: "article",
          title: { ru: "Заголовок" },
          subtitle: { ru: "<strong>Анонс</strong>" },
          description: { ru: "<p>Текст</p>" },
        } as any
      }
    >
      <div>Scoped ordered content</div>
    </Component>,
  );
  expect(html).toContain("Заголовок");
  expect(html).toContain("Анонс");
  expect(html).toContain("Текст");
  expect(html).toContain("media-a");
  expect(html).toContain("media-b");
  expect(html).toContain("Scoped ordered content");
  expect(mockWidgetLinks).not.toHaveBeenCalled();
});
