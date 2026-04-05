import { getApiUrl, getRequiredEnv } from "./env";

export type ApiRequestOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  token?: string;
  includeSecret?: boolean;
  data?: Record<string, unknown>;
};

export type ApiResponse<T> = {
  status: number;
  payload: T;
};

export async function requestApi<T = any>({
  method,
  path,
  token,
  includeSecret = false,
  data,
}: ApiRequestOptions): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (includeSecret) {
    headers.set("X-RBAC-SECRET-KEY", getRequiredEnv("RBAC_SECRET_KEY"));
  }

  let body: URLSearchParams | undefined;

  if (data !== undefined) {
    body = new URLSearchParams();
    body.set("data", JSON.stringify(data));
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body,
  });

  const text = await response.text();
  let payload: T | any = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  return {
    status: response.status,
    payload,
  };
}

export async function expectOk<T = any>(
  request: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const result = await requestApi<T>(request);

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `Request failed (${request.method} ${request.path}) with status ${result.status}: ${JSON.stringify(result.payload)}`,
    );
  }

  return result;
}
