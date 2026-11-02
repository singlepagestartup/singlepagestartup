/**
 * Shape checks for credential columns holding bcrypt output (issue #270).
 *
 * Written for the RBAC identity, whose password and salt are the only such
 * columns today, and kept here rather than beside that model's services
 * because it is a value predicate, not service behaviour.
 *
 * The identity service does not override `update`, so it falls through to the
 * generic CRUD action, which writes whatever it is handed. Nothing hashed the
 * incoming value and nothing checked its shape, so an ordinary PATCH — or the
 * admin form, which posts the whole model back — could write a cleartext
 * password, or an empty string when the field was simply left untouched. Either
 * value makes the account unauthenticatable: login always compares a bcrypt
 * digest against the stored column, so neither can ever match, and
 * `changePassword` is closed off too because it verifies the current password
 * the same way.
 *
 * The framework's own writers — registration, `changePassword`, reset-password
 * and forgot-password — always store bcrypt output. So the rule is the value's
 * shape rather than the caller's identity: a bcrypt digest passes, anything else
 * is rejected. Keying this on the operator secret instead would not protect,
 * because the client SDK lifts that secret out of a cookie into a header on
 * every browser call.
 *
 * `null` is allowed through: clearing the reset code is how a completed
 * password reset closes itself.
 */

/** `$2a$`/`$2b$`/`$2y$`, a two-digit cost, then 53 chars of salt and digest. */
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/** A bcrypt salt, which is what the reset code is generated from, minus `/`. */
const BCRYPT_SALT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{20,22}$/;

export function isBcryptHash(value: unknown): boolean {
  return typeof value === "string" && BCRYPT_HASH_PATTERN.test(value);
}

export function isBcryptSalt(value: unknown): boolean {
  return typeof value === "string" && BCRYPT_SALT_PATTERN.test(value);
}

/**
 * Throws when `data` carries a credential column that is not already hashed.
 * Absent keys are untouched, so an update that does not mention them passes.
 */
export function assertCredentialColumnsAreHashed(data: unknown): void {
  if (!data || typeof data !== "object") {
    return;
  }

  const record = data as Record<string, unknown>;

  if ("password" in record && record["password"] !== null) {
    if (!isBcryptHash(record["password"])) {
      throw new Error(
        "Validation error. The password column accepts only a hashed value. " +
          "Use the change-password route to set a password.",
      );
    }
  }

  if ("salt" in record && record["salt"] !== null) {
    if (!isBcryptSalt(record["salt"])) {
      throw new Error(
        "Validation error. The salt column accepts only a generated bcrypt salt.",
      );
    }
  }
}
