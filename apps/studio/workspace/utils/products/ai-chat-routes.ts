export interface IAIChatRoute {
  page:
    | "landing"
    | "register"
    | "login"
    | "account-settings"
    | "help"
    | "tokens"
    | "project-create"
    | "products"
    | "project-settings"
    | "thread-create";
  profileId?: string;
}
export function resolveAIChatRoute(href: string): IAIChatRoute | undefined {
  const path = href.split(/[?#]/)[0].replace(/\/$/, "");
  const simple: Record<string, IAIChatRoute["page"]> = {
    "/ai-chat": "landing",
    "/ai-chat/register": "register",
    "/ai-chat/login": "login",
    "/ai-chat/settings": "account-settings",
    "/ai-chat/help": "help",
    "/ai-chat/tokens": "tokens",
    "/ai-chat/projects/new": "project-create",
  };
  if (simple[path]) return { page: simple[path] };
  const match = path.match(
    /^\/ai-chat\/projects\/([^/]+)(\/settings|\/threads\/new)?$/,
  );
  if (!match || match[1] === "new") return;
  let profileId: string;
  try {
    profileId = decodeURIComponent(match[1]);
  } catch {
    return;
  }
  return {
    page:
      match[2] === "/settings"
        ? "project-settings"
        : match[2] === "/threads/new"
          ? "thread-create"
          : "products",
    profileId,
  };
}
export const isAIChatRoute = (href: string) => !!resolveAIChatRoute(href);
