/**
 * BDD Suite: MCP forwarded authentication helper
 * Given MCP resources and tools call protected SPS API routes through SDK adapters
 * When authorization is provided by the MCP transport or tool input
 * Then SDK options use the same headers accepted by the SPS frontend/API path
 */

import { getMcpAuthHeaders } from "../auth";
import { getMcpSdkOptions } from "./auth";

function createExtra(props: {
  headers?: Record<string, string | string[] | undefined>;
  authInfo?: {
    token: string;
    clientId?: string;
    scopes?: string[];
    extra?: Record<string, unknown>;
  };
  meta?: Record<string, unknown>;
}) {
  return {
    requestInfo: props.headers ? { headers: props.headers } : undefined,
    authInfo: props.authInfo
      ? {
          token: props.authInfo.token,
          clientId: props.authInfo.clientId ?? "mcp-client",
          scopes: props.authInfo.scopes ?? [],
          extra: props.authInfo.extra,
        }
      : undefined,
    _meta: props.meta,
  } as any;
}

describe("MCP forwarded authentication helper", () => {
  /**
   * BDD Scenario: Secret header is forwarded from the MCP request
   * Given an MCP client sends X-RBAC-SECRET-KEY
   * When SDK auth headers are built
   * Then the API receives the same root-secret header
   */
  it("forwards X-RBAC-SECRET-KEY from request headers", () => {
    expect(
      getMcpAuthHeaders(
        createExtra({
          headers: {
            "x-rbac-secret-key": "test-secret",
          },
        }),
      ),
    ).toEqual({
      "X-RBAC-SECRET-KEY": "test-secret",
    });
  });

  /**
   * BDD Scenario: JWT input is converted to a bearer header
   * Given a tool call provides a JWT in its auth input
   * When SDK auth headers are built
   * Then the API receives Authorization: Bearer <jwt>
   */
  it("builds Authorization from tool JWT input", () => {
    expect(getMcpAuthHeaders(undefined, { auth: { jwt: "test-jwt" } })).toEqual(
      {
        Authorization: "Bearer test-jwt",
      },
    );
  });

  /**
   * BDD Scenario: Frontend JWT cookie is reused
   * Given the MCP transport forwards the same rbac.subject.jwt cookie used by the frontend
   * When SDK auth headers are built
   * Then the API receives a bearer Authorization header
   */
  it("builds Authorization from the frontend JWT cookie", () => {
    expect(
      getMcpAuthHeaders(
        createExtra({
          headers: {
            cookie: "rbac.subject.jwt=test-cookie-jwt",
          },
        }),
      ),
    ).toEqual({
      Authorization: "Bearer test-cookie-jwt",
    });
  });

  /**
   * BDD Scenario: MCP auth info token is reused
   * Given an authenticated MCP transport provides authInfo.token
   * When SDK auth headers are built
   * Then the API receives Authorization: Bearer <token>
   */
  it("builds Authorization from MCP auth info", () => {
    expect(
      getMcpAuthHeaders(
        createExtra({
          authInfo: {
            token: "transport-jwt",
          },
        }),
      ),
    ).toEqual({
      Authorization: "Bearer transport-jwt",
    });
  });

  /**
   * BDD Scenario: MCP request metadata can carry auth
   * Given a stdio MCP request includes auth in _meta
   * When SDK auth headers are built
   * Then the API receives Authorization: Bearer <jwt>
   */
  it("builds Authorization from MCP request metadata", () => {
    expect(
      getMcpAuthHeaders(
        createExtra({
          meta: {
            jwt: "meta-jwt",
          },
        }),
      ),
    ).toEqual({
      Authorization: "Bearer meta-jwt",
    });
  });

  /**
   * BDD Scenario: Secret auth takes precedence over JWT auth
   * Given both secret and JWT credentials are present
   * When SDK auth headers are built
   * Then the API receives only X-RBAC-SECRET-KEY
   */
  it("prefers the secret header when both auth modes are provided", () => {
    expect(
      getMcpAuthHeaders(
        createExtra({
          headers: {
            authorization: "Bearer request-jwt",
          },
        }),
        {
          auth: {
            rbacSecretKey: "test-secret",
          },
        },
      ),
    ).toEqual({
      "X-RBAC-SECRET-KEY": "test-secret",
    });
  });

  /**
   * BDD Scenario: SDK options keep the forwarded auth headers
   * Given a caller has already resolved auth headers
   * When content-management SDK options are built
   * Then those headers are passed through unchanged
   */
  it("wraps forwarded headers in SDK options", () => {
    expect(
      getMcpSdkOptions({
        Authorization: "Bearer test-jwt",
      }),
    ).toEqual({
      headers: {
        Authorization: "Bearer test-jwt",
      },
    });
  });

  /**
   * BDD Scenario: Missing auth is rejected
   * Given no MCP request header, auth info, cookie, metadata, or tool auth input exists
   * When SDK auth headers are built
   * Then an authentication error prevents an unauthenticated API call
   */
  it("throws when no forwarded auth is available", () => {
    expect(() => getMcpAuthHeaders()).toThrow(
      "Authentication error. Provide Authorization: Bearer <jwt> or X-RBAC-SECRET-KEY",
    );
  });
});
