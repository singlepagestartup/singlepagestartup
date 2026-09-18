/**
 * BDD Suite: unique constraint error detection.
 *
 * Given: an error raised while inserting a row that violates a natural key.
 * When: the shared predicate inspects the error and its wrappers.
 * Then: only PostgreSQL unique violations are reported as conflicts.
 */

import { util as isUniqueConstraintError } from "./index";

describe("Given: a request loses a race against a unique index", () => {
  it("reports a raw PostgreSQL unique violation by SQLSTATE code", () => {
    const error = Object.assign(new Error("insert failed"), { code: "23505" });

    expect(isUniqueConstraintError(error)).toBe(true);
  });

  it("reports a driver error that names the violated constraint", () => {
    const error = new Error(
      'duplicate key value violates unique constraint "sps_rc_identity_telegram_account_unique"',
    );

    expect(isUniqueConstraintError(error)).toBe(true);
  });

  /**
   * BDD Scenario: the API response pipe wraps the violation.
   *
   * Given: the API serializes the failure into an HTTPException message.
   * When: the caller inspects the rethrown error.
   * Then: the conflict is still recognized through the serialized payload.
   */
  it("reports a violation serialized into an HTTPException message", () => {
    const payload = {
      message:
        'Internal server error: duplicate key value violates unique constraint "sl_thread_slug_unique"',
      status: 500,
      cause: [
        {
          message:
            'Internal server error: duplicate key value violates unique constraint "sl_thread_slug_unique"',
        },
      ],
      requestId: "PtXE08ieefubcfhdB_36K",
    };
    const error = Object.assign(new Error(JSON.stringify(payload)), {
      status: 500,
      cause: payload,
    });

    expect(isUniqueConstraintError(error)).toBe(true);
  });

  it("reports a violation nested inside a cause array", () => {
    const error = {
      message: "Internal server error",
      cause: [
        { message: "unrelated" },
        {
          message:
            'duplicate key value violates unique constraint "sps_rc_permission_type_method_path_unique"',
        },
      ],
    };

    expect(isUniqueConstraintError(error)).toBe(true);
  });

  it("ignores unrelated failures", () => {
    expect(isUniqueConstraintError(new Error("fetch failed"))).toBe(false);
    expect(
      isUniqueConstraintError(
        new Error(
          JSON.stringify({ message: "Permission error.", status: 403 }),
        ),
      ),
    ).toBe(false);
    expect(isUniqueConstraintError(undefined)).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
    expect(isUniqueConstraintError("plain string")).toBe(false);
  });

  it("stops walking a self-referencing error chain", () => {
    const error: { message: string; cause?: unknown } = {
      message: "Internal server error",
    };
    error.cause = error;

    expect(isUniqueConstraintError(error)).toBe(false);
  });
});
