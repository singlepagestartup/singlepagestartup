import { util } from ".";

describe("util", () => {
  test("Detects category from prefix in message", () => {
    const error = new Error("[Validation error] Invalid input data");
    const result = util(error);
    expect(result.status).toBe(400);
    expect(result.category).toBe("Validation error");
    expect(result.message).toMatch(/\[Validation error]/);
  });

  test("Detects category from RegExp pattern", () => {
    const error = new Error("unauthorized access");
    const result = util(error);
    expect(result.status).toBe(401);
    expect(result.category).toBe("Authentication error");
    expect(result.message).toContain("unauthorized");
  });

  test("Fallback as Internal error for unknown messages", () => {
    const error = new Error("some unknown error");
    const result = util(error);
    expect(result.status).toBe(500);
    expect(result.category).toBe("Internal error");
    expect(result.message).toContain("Internal server error");
  });

  test("Handles details via 'cause' property", () => {
    const original = { important: true };
    const error = new Error("not found");
    (error as any).cause = original;
    const result = util(error);
    expect(result.status).toBe(404);
    expect(result.details).toEqual(original);
  });

  test("Parses prefix category with extra text", () => {
    const error = new Error(
      "[Permission error] Only order owner can update order: denied",
    );
    const result = util(error);
    expect(result.status).toBe(403);
    expect(result.category).toBe("Permission error");
  });

  test("Allows plain string input with prefix", () => {
    const error = "[Authentication error] Invalid credentials";
    const result = util(error);
    expect(result.status).toBe(401);
    expect(result.category).toBe("Authentication error");
  });
});
