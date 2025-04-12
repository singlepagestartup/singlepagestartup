export function util() {
  const cookies = document.cookie;

  const jwt = cookies
    .split("; ")
    .find((cookie) => cookie.startsWith("rbac.subject.jwt="))
    ?.split("=")[1];
  const secretKey = cookies
    .split("; ")
    .find((cookie) => cookie.startsWith("rbac.secret-key="))
    ?.split("=")[1];

  const headers: HeadersInit = {};

  if (jwt) {
    headers.Authorization = "Bearer " + jwt;
  }

  if (secretKey) {
    headers["X-RBAC-SECRET-KEY"] = secretKey;
  }

  return headers;
}
