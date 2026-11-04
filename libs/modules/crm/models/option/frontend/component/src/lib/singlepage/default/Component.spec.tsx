import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";

jest.mock(
  "@sps/crm/relations/options-to-file-storage-module-files/frontend/component",
  () => ({
    Component: () => null,
  }),
);

describe("CRM Option localized display", () => {
  it.each([{}, { ru: "" }])(
    "shows English titles when the selected translation is missing or empty",
    (translation) => {
      const html = renderToStaticMarkup(
        <Component
          isServer={false}
          variant="default"
          language="ru"
          data={
            {
              id: "option-id",
              title: { en: "Account access", ...translation },
            } as any
          }
        />,
      );
      expect(html).toContain("Account access");
    },
  );
  it("preserves an authored title in the selected language", () => {
    const html = renderToStaticMarkup(
      <Component
        isServer={false}
        variant="default"
        language="ru"
        data={
          {
            id: "option-id",
            title: { en: "Account access", ru: "Доступ к аккаунту" },
          } as any
        }
      />,
    );
    expect(html).toContain("Доступ к аккаунту");
    expect(html).not.toContain("Account access");
  });
});
