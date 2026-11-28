import { renderToStaticMarkup } from "react-dom/server";
import type { IModel } from "./interface";
import { Component as Hero } from "./Component";
import { Component as Cta } from "../content-cta/Component";

jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value }: { value: string }) => <p>{value}</p>,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(" "),
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock(
  "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component",
  () => ({ Component: () => null }),
);
jest.mock(
  "@sps/website-builder/relations/widgets-to-features/frontend/component",
  () => ({ Component: () => null }),
);

const subtitle = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Открытый код",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Документация",
          marks: [{ type: "link", attrs: { href: "/ru/framework" } }],
        },
      ],
    },
  ],
});
const props = {
  isServer: true,
  language: "ru",
  data: {
    id: "framework-widget",
    adminTitle: "Framework widget",
    slug: "framework-widget",
    variant: "content-hero",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    title: { ru: "Фреймворк" },
    subtitle: { ru: subtitle, en: "Legacy subtitle" },
    description: { ru: "Описание" },
    className: "",
    anchor: "",
  } satisfies IModel,
} as const;

const views = [
  { name: "hero", render: () => <Hero variant="content-hero" {...props} /> },
  { name: "CTA", render: () => <Cta variant="content-cta" {...props} /> },
];

it.each(views)(
  "renders the saved $name subtitle before hydration",
  ({ render }) => {
    const html = renderToStaticMarkup(render());

    expect(html).toContain(
      '<p><strong>Открытый код</strong></p><p><a href="/ru/framework">Документация</a></p>',
    );
    expect(html).not.toContain("Legacy subtitle");
    expect(html).not.toContain("&quot;type&quot;");
  },
);

it("keeps the hero's legacy subtitle and English fallback", () => {
  const html = renderToStaticMarkup(
    <Hero {...props} language="de" variant="content-hero" />,
  );

  expect(html).toContain("<p>Legacy subtitle</p>");
  expect(html).not.toContain("Открытый код");
});
