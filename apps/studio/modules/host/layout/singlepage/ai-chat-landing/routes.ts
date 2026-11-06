export interface IAIChatRoute {
  page:
    | "landing"
    | "register"
    | "login"
    | "account-settings"
    | "help"
    | "tokens"
    | "profile-list"
    | "profile-create"
    | "profile-overview"
    | "profile-settings"
    | "thread-create";
  profileId?: string;
  chatId?: string;
}

export const aiChatServiceHrefs = {
  landing: "/",
  register: "/ai-chat/rbac/subjects/authentication/registration",
  login: "/ai-chat/rbac/subjects/authentication/select-method",
  "account-settings": "/ai-chat/rbac/subjects/settings",
  help: "/ai-chat/help",
  tokens: "/ai-chat/rbac/subjects/tokens",
  "profile-list": "/ai-chat/projects",
  "profile-create": "/ai-chat/social/profiles/create",
} as const;

export const aiChatProfileHref = (profileId: string) =>
  `/ai-chat/social/profiles/${encodeURIComponent(profileId)}`;

export const aiChatProfileChatId = (profileId: string) =>
  `${profileId}:project-chat`;

export const aiChatThreadCreateHref = (
  profileId: string,
  chatId = aiChatProfileChatId(profileId),
) =>
  `${aiChatProfileHref(profileId)}/chats/${encodeURIComponent(chatId)}/threads/create`;

export function resolveAIChatRoute(href: string): IAIChatRoute | undefined {
  const path = href.split(/[?#]/)[0].replace(/\/$/, "");
  for (const [page, address] of Object.entries(aiChatServiceHrefs)) {
    if (path === address.replace(/\/$/, ""))
      return { page: page as keyof typeof aiChatServiceHrefs };
  }
  const match = path.match(
    /^\/ai-chat\/social\/profiles\/([^/]+)(?:\/(settings)|\/chats\/([^/]+)\/threads\/create)?$/,
  );
  if (!match) return;
  try {
    const profileId = decodeURIComponent(match[1]);
    if (profileId === "create") return;
    return {
      page: match[2]
        ? "profile-settings"
        : match[3]
          ? "thread-create"
          : "profile-overview",
      profileId,
      ...(match[3] ? { chatId: decodeURIComponent(match[3]) } : {}),
    };
  } catch {
    return;
  }
}

export const isAIChatRoute = (href: string) => !!resolveAIChatRoute(href);
