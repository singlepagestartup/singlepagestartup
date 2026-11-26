import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Page } from "../..";
import { services } from "../../../../rbac/widget/singlepage/framework-service-list/fixtures";

test("Framework exposes all service detail pages in both languages", () => {
  for (const language of ["ru", "en"] as const) {
    const catalog = renderToStaticMarkup(
      <Page variant="framework-service-list" language={language} />,
    );
    expect(catalog).toContain(
      'data-module="website-builder" data-model="widget" data-variant="content-service-list"',
    );
    expect(catalog).toContain(
      language === "ru" ? "Услуги ИИ-агентов" : "AI agent services",
    );
    for (const service of services) {
      expect(catalog).toContain(
        encodeURIComponent(`productSlug:${service.slug}`),
      );
      expect(catalog).toContain(service.title[language]);
      const detail = renderToStaticMarkup(
        <Page
          variant="framework-service-detail"
          language={language}
          productSlug={service.slug}
        />,
      );
      expect(detail).toContain(service.summary[language]);
      expect(detail).toContain(
        'data-module="website-builder" data-model="widget" data-variant="content-service-detail"',
      );
      expect(detail).toContain(
        `/${language}/framework/services/${service.slug}#booking`,
      );
    }
  }
});

test("an unavailable service has no booking entry", () => {
  const detail = renderToStaticMarkup(
    <Page variant="framework-service-detail" productSlug="unavailable" />,
  );
  expect(detail).toContain("Услуга недоступна");
  expect(detail).not.toContain("Открыть оформление заказа");
});
