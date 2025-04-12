import { authorization } from "..";

export function util(props?: Record<string, any>) {
  let saturatedHeaders = { ...(props || {}) };
  const authrizationHeaders = authorization.headers();

  if (Object.keys(authrizationHeaders)) {
    saturatedHeaders = {
      ...saturatedHeaders,
      ...authrizationHeaders,
    };
  }

  return saturatedHeaders;
}
