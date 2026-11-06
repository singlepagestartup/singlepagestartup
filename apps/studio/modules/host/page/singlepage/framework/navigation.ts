import type { FrameworkLinkResolver } from "./interface";
const prefix = "/?path=/story/modules-host-models-page-singlepage-";
export const resolveFrameworkLink: FrameworkLinkResolver = (href) => {
  const [pathname] = href.split(/[?#]/);
  let story: string | undefined;
  let args: string | undefined;
  if (pathname === "/framework") story = "framework";
  else if (pathname === "/framework/modules") story = "framework-module-find";
  else if (pathname.startsWith("/framework/modules/")) {
    story = "framework-module-slug";
    args = `moduleSlug:${decodeURIComponent(pathname.slice(19))}`;
  } else if (pathname === "/blog") story = "blog-module-article-find";
  else if (pathname.startsWith("/blog/categories/")) {
    story = "blog-module-category-slug";
    args = `categorySlug:${decodeURIComponent(pathname.slice(17))}`;
  } else if (pathname.startsWith("/blog/articles/")) {
    story = "blog-module-article-slug";
    args = `articleSlug:${decodeURIComponent(pathname.slice(15))}`;
  } else if (pathname === "/ecommerce") story = "ecommerce-module-token-find";
  else if (pathname === "/" || pathname === "/ai-chat/") story = "ai-chat";
  else if (pathname === "/ai-chat/rbac/subjects/authentication/registration")
    story = "rbac-module-subject-me-authentication-registration-ai-chat";
  else if (pathname === "/ai-chat/rbac/subjects/authentication/select-method")
    story = "rbac-module-subject-me-authentication-select-method-ai-chat";
  else if (pathname === "/ai-chat/rbac/subjects/subscriptions/pro")
    story = "ecommerce-module-token-find";
  else if (pathname === "/ai-chat/rbac/subjects/tokens")
    story =
      "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat";
  else if (pathname === "/ai-chat/help") story = "ai-chat-help";
  return story
    ? {
        href: `${prefix}${story}--default${args ? `&args=${encodeURIComponent(args)}` : ""}`,
        target: "_top",
      }
    : href;
};
