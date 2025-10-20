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
    ])("maps '%s' → 400 Validation error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(400);
      expect(result.category).toBe("Validation error");
    });
  });

  // ------------------- 400 PAYMENT ERROR -------------------
  describe("400 - Payment error", () => {
    test.each([
      "Payment intent not found",
      "cloudpayments credentials not found",
      "stripe secret key not found",
      "Payment intent is not succeeded",
      "Currency is required",
      "Channel not found",
      "Multiple billing module payment",
    ])("maps '%s' → 400 Payment error", (msg) => {
      const result = util(new Error(msg));
      expect(result.status).toBe(400);
      expect(result.category).toBe("Payment error");
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

  // ------------------- 500 INTERNAL ERROR -------------------
  describe("500 - Internal error", () => {
    test.each([
      "Internal Server Error",
      "Configuration error.",
      "Environment error. rbac_secret_key not found",
      "RBAC_JWT_SECRET not set",
      "rbac_secret_key is not defined",
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
