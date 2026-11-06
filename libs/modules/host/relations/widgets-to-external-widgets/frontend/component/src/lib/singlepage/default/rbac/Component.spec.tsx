import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";

const record = {
  id: "rbac-auth-widget",
  variant: "subject-me-authentication-select-method-ai-chat",
};
const rbacReads = jest.fn();
const rbacRenders = jest.fn();
const websiteReads = jest.fn();
const websiteRenders = jest.fn();
const pageReads = jest.fn();
const routeParams = Object.freeze({
  "social.profiles.id": "profile",
  "social.chats.id": "chat",
  "social.threads.id": "thread",
  "rbac.subjects.slug": "subject",
  "ecommerce.products.slug": "product",
  "ecommerce.categories.slug": "category",
  "ecommerce.stores.slug": "store",
  "extension.records.slug": "future-value",
});
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: (props: any) => {
    pageReads(props);
    return props.children({
      data: {
        "social.profiles.id": "profile",
        "social.chats.id": "chat",
        "social.threads.id": "thread",
        "rbac.subjects.slug": "subject",
        "ecommerce.products.slug": "product",
        "ecommerce.categories.slug": "category",
        "ecommerce.stores.slug": "store",
      },
    });
  },
}));
jest.mock("@sps/rbac/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      rbacReads(props.apiProps);
      return props.children({ data: [record] });
    }
    rbacRenders(props);
    return <form data-rbac-widget={props.data.id}>Authentication fields</form>;
  },
}));
jest.mock("@sps/website-builder/models/widget/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "find") {
      websiteReads(props.apiProps);
      return props.children({ data: [{ id: "website-auth-widget" }] });
    }
    websiteRenders(props);
    return <main data-website-widget={props.data.id}>{props.children}</main>;
  },
}));
beforeEach(() => {
  rbacReads.mockClear();
  rbacRenders.mockClear();
  websiteReads.mockClear();
  websiteRenders.mockClear();
  pageReads.mockClear();
});
it.each(["select-method", "registration", "forgot-password", "reset-password"])(
  "loads the exact %s RBAC Widget and delegates its own content composition",
  (action) => {
    record.variant = `subject-me-authentication-${action}-ai-chat`;
    const html = renderToStaticMarkup(
      <Component
        {...({
          isServer: true,
          data: { externalWidgetId: record.id },
          url: "/ai-chat/sign-in",
          language: "en",
          socialModuleProfileId: "profile",
          socialModuleChatId: "chat",
          socialModuleThreadId: "thread",
          subjectSlug: "subject",
          ecommerceModuleProductSlug: "product",
          ecommerceModuleCategorySlug: "category",
          ecommerceModuleStoreSlug: "store",
        } as any)}
      />,
    );
    expect(rbacReads).toHaveBeenCalledWith({
      params: {
        filters: { and: [{ column: "id", method: "eq", value: record.id }] },
      },
    });
    expect(websiteReads).not.toHaveBeenCalled();
    expect(websiteRenders).not.toHaveBeenCalled();
    expect(html).toContain('<form data-rbac-widget="rbac-auth-widget">');
    expect(rbacRenders.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        data: record,
        dataSource: "props",
        socialModuleProfileId: "profile",
        socialModuleChatId: "chat",
        socialModuleThreadId: "thread",
        subjectSlug: "subject",
        ecommerceModuleProductSlug: "product",
        ecommerceModuleCategorySlug: "category",
        ecommerceModuleStoreSlug: "store",
        language: "en",
        variant: record.variant,
      }),
    );
    expect(rbacRenders.mock.calls[0][0]).not.toHaveProperty("url");
    expect(rbacRenders.mock.calls[0][0]).not.toHaveProperty("routeParams");
    for (const key of [
      "profileId",
      "chatId",
      "threadId",
      "productSlug",
      "categorySlug",
      "storeSlug",
      "rbacModuleSubjectSlug",
    ])
      expect(rbacRenders.mock.calls[0][0]).not.toHaveProperty(key);
    expect(pageReads).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "url-segment-values",
        url: "/ai-chat/sign-in",
      }),
    );
  },
);
