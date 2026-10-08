export function isAIChatRoute(url: string): boolean {
  const path = url.split(/[?#]/)[0].replace(/\/$/, "");
  return (
    [
      "/ai-chat",
      "/ai-chat/register",
      "/ai-chat/login",
      "/ai-chat/settings",
      "/ai-chat/help",
      "/ai-chat/tokens",
      "/ai-chat/projects/new",
    ].includes(path) || /^\/ai-chat\/projects\/[^/]+$/.test(path)
  );
}
