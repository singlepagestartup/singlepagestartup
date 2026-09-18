/**
 * BDD Suite: util — HTTP error classification.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util } from ".";

describe("util — HTTP error classification", () => {
  // ------------------- 400 VALIDATION ERROR -------------------
  describe("400 - Validation error", () => {
    test.each([
      "Invalid data",
      "Validation error",
      "Invalid request body",
      "Missing headers",

      "Invalid id, id is required",
      "No id provided",
      "Invalid messageId, messageId is required",
      "No uuid provided",
      "No productId provided",

      "Invalid data, should be array",

      "No notification.topic.slug provided",
      "Invalid notification method",
      "Provider google is not allowed",
      "Files are not supported",
      "Multiple files are not allowed",
      "Passwords do not match",
      "Code is expired. Resend again.",
      "Account already exists",

      "Validation error. Invalid body['data']: undefined. Expected string, got: undefined",
      "Validation error. Unprocessable Entity",
      "Validation error. Invalid type. Expected email, got: string",
    ])("maps '%s' → 400 Validation error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(400);
      expect(result.category).toBe("Validation error");
    });
  });

  // ------------------- 401 AUTHENTICATION ERROR -------------------
  describe("401 - Authentication error", () => {
    test.each([
      "unauthorized",
      "Invalid credentials",
      "No session",
      "Authorization error",
      "No subject provided in the token",
      "Token required",
      "invalid token issued",
      "token(abc.def.ghi) signature mismatched",
      "invalid signature",
      "jwt malformed",
    ])("maps '%s' → 401 Authentication error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(401);
      expect(result.category).toBe("Authentication error");
    });
  });

  // ------------------- 403 PERMISSION ERROR -------------------
  describe("403 - Permission error", () => {
    test.each([
      "Forbidden",
      "permission denied",
      "Authentication failed",
      "Only order owner can update order",
      "Only identity owner can create identity",
      'Permission error. You do not have access to this resource: {"route":"/api/crm/forms-to-steps","method":"GET","type":"HTTP"}',
    ])("maps '%s' → 403 Permission error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(403);
      expect(result.category).toBe("Permission error");
    });
  });

  // ------------------- 404 NOT FOUND ERROR -------------------
  describe("404 - Not Found error", () => {
    test.each([
      "not found",
      "Entity not found",
      "Form not found",
      "Entity with param abc-123 not found",
      "no inputs found",
      "no products found",
      "no orders to products found",
      "Order already exists",
      "Order is not in 'new' status",
      "Not found. No matching action for route: /api/v1/test",
      "no ecommerce orders to billing module currencies found",
    ])("maps '%s' → 404 Not Found error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(404);
      expect(result.category).toBe("Not Found error");
    });
  });

  // ------------------- 422 UNPROCESSABLE ENTITY ERROR -------------------
  describe("422 - Unprocessable Entity error", () => {
    test.each([
      "Expected string",
      "Invalid body['data']",
      "Unprocessable Entity",
      "Invalid type. Expected email, got: string",
      "Expected string",
      "Invalid body['data']",
    ])("maps '%s' → 422 Unprocessable Entity error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(422);
      expect(result.category).toBe("Unprocessable Entity error");
    });
  });

  // ------------------- 409 CONFLICT ERROR -------------------
  describe("409 - Conflict error", () => {
    const constraint = "sps_blog_article_slug_unique";
    const driverMessage = `duplicate key value violates unique constraint "${constraint}"`;

    function driverError() {
      return Object.assign(new Error(driverMessage), {
        name: "PostgresError",
        code: "23505",
        constraint_name: constraint,
        table_name: "sps_blog_article",
        column_name: "slug",
        detail: "Key (slug)=(already-taken) already exists.",
      });
    }

    /**
     * BDD Scenario
     * Given: a PostgreSQL unique violation as the driver raises it.
     * When: the error is classified.
     * Then: the result is a 409 whose message names no database object.
     */
    test("maps a driver unique violation → 409 with a generic message", () => {
      const result = util(driverError());
      expect(result.status).toBe(409);
      expect(result.category).toBe("Conflict error");
      expect(result.message).toBe("Conflict error. Entity already exists");
      expect(result.message).not.toContain(constraint);
      expect(result.message).not.toContain("sps_blog_article");
      expect(result.message).not.toContain("already-taken");
    });

    /**
     * BDD Scenario
     * Given: the same violation wrapped as a cause by a calling layer.
     * When: the error is classified.
     * Then: it is still a 409, and the driver error stays available as details.
     */
    test("recognizes a wrapped unique violation and keeps the driver error in details", () => {
      const cause = driverError();
      const result = util(new Error("Request not created", { cause }));
      expect(result.status).toBe(409);
      expect(result.message).toBe("Conflict error. Entity already exists");
      expect(result.details).toBe(cause);
    });

    /**
     * BDD Scenario
     * Given: a downstream error body that a server SDK hop re-encoded as JSON.
     * When: the error is classified on the calling hop.
     * Then: the conflict is recognized instead of being repeated as a 500.
     */
    test("recognizes a unique violation carried by a serialized payload", () => {
      const result = util(
        new Error(
          JSON.stringify({
            message: `Internal server error: ${driverMessage}`,
            status: 500,
            requestId: "request-1",
          }),
        ),
      );
      expect(result.status).toBe(409);
      expect(result.message).toBe("Conflict error. Entity already exists");
    });

    /**
     * BDD Scenario
     * Given: an already sanitized conflict message from an inner hop.
     * When: the error is classified.
     * Then: the category survives the hop.
     */
    test("keeps the category for an already sanitized conflict message", () => {
      const result = util(new Error("Conflict error. Entity already exists"));
      expect(result.status).toBe(409);
      expect(result.category).toBe("Conflict error");
    });

    /**
     * BDD Scenario
     * Given: a database failure that is not a unique violation.
     * When: the error is classified.
     * Then: it keeps mapping to 500.
     */
    test("leaves a non-unique database failure at 500", () => {
      const result = util(
        Object.assign(new Error('relation "sps_blog_article" does not exist'), {
          name: "PostgresError",
          code: "42P01",
        }),
      );
      expect(result.status).toBe(500);
      expect(result.category).toBe("Internal error");
    });
  });

  // ------------------- CREDENTIAL SAFETY -------------------
  describe("401 - JWT failures carry no token", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWJqZWN0Ijp7ImlkIjoiMSJ9fQ.s1gn4tur3";

    /**
     * BDD Scenario
     * Given: a Hono JWT failure message that embeds the token.
     * When: the error is classified.
     * Then: the result is 401 and the returned message repeats no part of the token.
     */
    test.each([
      `token (${token}) expired`,
      `invalid JWT token: ${token}`,
      `token(${token}) signature mismatched`,
      `token (${token}) is being used before it's valid`,
    ])("maps '%s' → 401 without the token", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(401);
      expect(result.category).toBe("Authentication error");
      expect(result.message).not.toContain(token);
      expect(result.message).toContain("<redacted>");
    });

    /**
     * BDD Scenario
     * Given: the fixed messages the shared verification helper throws.
     * When: they are classified.
     * Then: they reach 401 rather than the 403 pattern for "authentication".
     */
    test.each([
      "Authentication error. Token expired",
      "Authentication error. Invalid token",
    ])("maps '%s' → 401 Authentication error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(401);
      expect(result.category).toBe("Authentication error");
    });

    /**
     * BDD Scenario
     * Given: a downstream error body that a server SDK hop re-encoded as JSON.
     * When: the error is classified.
     * Then: the downstream status survives and the token does not.
     */
    test("keeps a serialized downstream payload parseable while removing the token", () => {
      const result = util(
        new Error(
          JSON.stringify({
            message: `token (${token}) expired`,
            status: 401,
            requestId: "request-1",
          }),
        ),
      );
      expect(result.status).toBe(401);
      expect(result.category).toBe("Authentication error");
      expect(result.message).not.toContain(token);
    });

    /**
     * BDD Scenario
     * Given: a message with no credential in it.
     * When: the error is classified.
     * Then: the text is returned unchanged.
     */
    test("leaves an ordinary message untouched", () => {
      const result = util(new Error("Entity with param abc-123 not found"));
      expect(result.message).toBe("Entity with param abc-123 not found");
    });
  });

  // ------------------- 500 INTERNAL ERROR -------------------
  describe("500 - Internal error", () => {
    test.each([
      "Internal Server Error",
      "Configuration error.",
      "Environment error. rbac_secret_key not found",
      "RBAC_JWT_SECRET not set",
      "Configuration error. RBAC_SECRET_KEY is not defined",
      "Internal server error",
      "Request not created",
      "JWT secret not provided",
      "Server error",
    ])("maps '%s' → 500 Internal error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(500);
      expect(result.category).toBe("Internal error");
    });
  });

  // ------------------- ADVANCED & FALLBACK CASES -------------------
  describe("Advanced & Fallback cases", () => {
    test("detects category from prefix in message", () => {
      const error = new Error("[Validation error] Invalid input data");
      const result = util(error);
      expect(result.status).toBe(400);
      expect(result.category).toBe("Validation error");
    });

    test("parses prefix with extra text", () => {
      const error = new Error(
        "[Permission error] Only order owner can update order: denied",
      );
      const result = util(error);
      expect(result.status).toBe(403);
      expect(result.category).toBe("Permission error");
    });

    test("allows plain string input with prefix", () => {
      const result = util("[Authentication error] Invalid credentials");
      expect(result.status).toBe(401);
      expect(result.category).toBe("Authentication error");
    });

    test("returns Internal error for completely unknown message", () => {
      const result = util(
        new Error("a completely new and unknown situation happened"),
      );
      expect(result.status).toBe(500);
      expect(result.category).toBe("Internal error");
    });

    test("handles cause property correctly", () => {
      const details = { important: true, meta: "debug" };
      const error = new Error("not found");
      (error as any).cause = details;
      const result = util(error);
      expect(result.status).toBe(404);
      expect(result.category).toBe("Not Found error");
      expect(result.details).toEqual(details);
    });
  });
});
