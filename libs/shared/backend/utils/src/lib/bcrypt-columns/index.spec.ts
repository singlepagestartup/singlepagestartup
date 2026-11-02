/**
 * BDD Suite: the identity credential write guard.
 *
 * Given: the generic update path writes a credential column verbatim, without hashing it.
 * When: an update payload carrying a password or salt is checked.
 * Then: bcrypt output passes and every unhashed value is rejected.
 */

import bcrypt from "bcrypt";
import {
  assertCredentialColumnsAreHashed,
  isBcryptHash,
  isBcryptSalt,
} from ".";

describe("Given: an identity update payload", () => {
  /**
   * BDD Scenario
   * Given: the admin form posts the whole model back after the output schema removed the password.
   * When: the resulting empty string reaches the update guard.
   * Then: the write is rejected instead of locking the account out.
   */
  it("When: the password is an empty string Then: rejects the write", () => {
    expect(() =>
      assertCredentialColumnsAreHashed({ email: "a@b.c", password: "" }),
    ).toThrow(/accepts only a hashed value/i);
  });

  /**
   * BDD Scenario
   * Given: a caller sends a cleartext password through an ordinary update.
   * When: the guard checks it.
   * Then: the write is rejected, because login only ever compares bcrypt digests.
   */
  it("When: the password is cleartext Then: rejects the write", () => {
    expect(() =>
      assertCredentialColumnsAreHashed({ password: "hunter2" }),
    ).toThrow(/accepts only a hashed value/i);
  });

  /**
   * BDD Scenario
   * Given: change-password, reset-password and registration all store bcrypt output.
   * When: such a payload reaches the guard.
   * Then: it passes untouched.
   */
  it("When: the password is a bcrypt digest Then: allows the write", async () => {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("hunter2", salt);

    expect(() =>
      assertCredentialColumnsAreHashed({ password, salt }),
    ).not.toThrow();
  });

  /**
   * BDD Scenario
   * Given: an edit that changes only the email never mentions a credential column.
   * When: the guard checks it.
   * Then: it passes, so ordinary edits keep working.
   */
  it("When: no credential column is present Then: allows the write", () => {
    expect(() =>
      assertCredentialColumnsAreHashed({ email: "a@b.c", variant: "default" }),
    ).not.toThrow();
  });

  /**
   * BDD Scenario
   * Given: a completed password reset clears the stored code.
   * When: a null credential column reaches the guard.
   * Then: it passes, because clearing is how the reset closes itself.
   */
  it("When: a credential column is null Then: allows the write", () => {
    expect(() =>
      assertCredentialColumnsAreHashed({ password: null, salt: null }),
    ).not.toThrow();
  });

  /**
   * BDD Scenario
   * Given: the salt column is written by registration only, as generated bcrypt output.
   * When: an arbitrary salt value is checked.
   * Then: it is rejected.
   */
  it("When: the salt is not generated bcrypt output Then: rejects the write", () => {
    expect(() => assertCredentialColumnsAreHashed({ salt: "pepper" })).toThrow(
      /accepts only a generated bcrypt salt/i,
    );
  });
});

describe("Given: the bcrypt shape predicates", () => {
  /**
   * BDD Scenario
   * Given: bcrypt emits a sixty-character digest and a twenty-nine-character salt.
   * When: each predicate is applied to real output and to near misses.
   * Then: only genuine output is recognised.
   */
  it("When: values are checked Then: recognises only real bcrypt output", async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("hunter2", salt);

    expect(isBcryptHash(hash)).toBe(true);
    expect(isBcryptSalt(salt)).toBe(true);

    expect(isBcryptHash(salt)).toBe(false);
    expect(isBcryptHash("")).toBe(false);
    expect(isBcryptHash(null)).toBe(false);
    expect(isBcryptSalt("")).toBe(false);
  });
});
