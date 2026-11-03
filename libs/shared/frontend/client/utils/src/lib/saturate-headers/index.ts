import { authorization } from "..";

export function util(props?: Record<string, any>) {
  let saturatedHeaders = { "X-SPS-Consistency": "1", ...(props || {}) };
  const authrizationHeaders = authorization.headers();

  if (Object.keys(authrizationHeaders)) {
    saturatedHeaders = {
      ...saturatedHeaders,
      ...authrizationHeaders,
    };
  }

  return saturatedHeaders;
}
