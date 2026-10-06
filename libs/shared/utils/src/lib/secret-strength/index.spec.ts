/**
 * BDD Suite: Boot-time secret strength check.
 *
 * Given: the bootstrap generator used to derive secrets from the shell
 *        `$RANDOM` variable, whose entire output set is 32768 MD5 digests.
 * When:  the API, MCP or Telegram service reads its configured secrets at
 *        start-up.
 * Then:  a value from that set is named as legacy, a missing or short value is
 *        named as such, only the authorization secret and the token signing key
 *        are fatal, MCP and Telegram judge only the values they have set, and no
 *        report line ever carries the value itself.
 */

import {
  assessConfiguredSecrets,
  assessSecret,
  assessSecrets,
  formatSecretAssessment,
  isFatalSecretAssessment,
  isLegacyRandomSecret,
  CHECKED_SECRET_NAMES,
  MCP_CHECKED_SECRET_NAMES,
  TELEGRAM_CHECKED_SECRET_NAMES,
} from ".";

// Produced by the removed generator, `echo 0 | md5sum | head -c 32`. The digest
// covers the newline `echo` appends, which is what made the old output set
// exactly 32768 values.
const legacyDigestOfZero = "897316929176464ebc9ad085f31e7284";

// `echo 32767 | md5sum | head -c 32`, the top of the `$RANDOM` range.
const legacyDigestOfMaximum = "63fceb28a8c4c72fd3b2f5d71950ee08";

const rotated =
  "3f7c1f27bd6ee3d1cc5a3eb0f7d2a9e4b81c0a5d6f39e2748bca10d5e6f3927a";

describe("isLegacyRandomSecret", () => {
  /**
   * BDD Scenario: A value the removed generator could produce.
   */
  it("recognizes a digest from the $RANDOM output set", () => {
    expect(isLegacyRandomSecret(legacyDigestOfZero)).toBe(true);
    expect(isLegacyRandomSecret(legacyDigestOfMaximum)).toBe(true);
  });

  /**
   * BDD Scenario: A rotated value of the shape the generator now produces.
   */
  it("clears a 64 character value the current generator produces", () => {
    expect(isLegacyRandomSecret(rotated)).toBe(false);
  });

  /**
   * BDD Scenario: A 32 character value that is not in the set.
   */
  it("clears a 32 character value outside the output set", () => {
    expect(isLegacyRandomSecret("0123456789abcdef0123456789abcdef")).toBe(
      false,
    );
  });

  /**
   * BDD Scenario: Values that cannot be a digest at all.
   */
  it("clears an absent value and a value that is not lowercase hex", () => {
    expect(isLegacyRandomSecret(undefined)).toBe(false);
    expect(isLegacyRandomSecret("")).toBe(false);
    expect(isLegacyRandomSecret("897316929176464EBC9AD085F31E7284")).toBe(
      false,
    );
  });
});

describe("assessSecret", () => {
  /**
   * BDD Scenario: Each verdict the check can reach.
   */
  it("names a legacy, missing, short and acceptable value", () => {
    expect(assessSecret("RBAC_SECRET_KEY", legacyDigestOfZero).verdict).toBe(
      "legacy",
    );
    expect(assessSecret("RBAC_SECRET_KEY", "").verdict).toBe("missing");
    expect(assessSecret("RBAC_SECRET_KEY", undefined).verdict).toBe("missing");
    expect(assessSecret("RBAC_SECRET_KEY", "a".repeat(20)).verdict).toBe(
      "short",
    );
    expect(assessSecret("RBAC_SECRET_KEY", rotated).verdict).toBe("ok");
  });

  /**
   * BDD Scenario: The reported name is the one that was asked about.
   */
  it("carries the key name through to the assessment", () => {
    expect(assessSecret("RBAC_JWT_SECRET", rotated)).toEqual({
      name: "RBAC_JWT_SECRET",
      verdict: "ok",
    });
  });
});

describe("assessSecrets", () => {
  /**
   * BDD Scenario: Every transported secret is looked at, in report order.
   */
  it("assesses each checked name from the supplied environment", () => {
    const assessments = assessSecrets({
      RBAC_SECRET_KEY: legacyDigestOfZero,
      RBAC_JWT_SECRET: rotated,
      MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET: "a".repeat(20),
      RBAC_COOKIE_SESSION_SECRET: rotated,
      KV_PASSWORD: rotated,
      DATABASE_PASSWORD: undefined,
    });

    expect(assessments.map((assessment) => assessment.name)).toEqual(
      CHECKED_SECRET_NAMES,
    );
    expect(assessments.map((assessment) => assessment.verdict)).toEqual([
      "legacy",
      "ok",
      "short",
      "ok",
      "ok",
      "missing",
    ]);
  });
});

describe("assessConfiguredSecrets", () => {
  /**
   * BDD Scenario: A service is judged on the values it has set.
   */
  it("judges only the MCP secrets that carry a value", () => {
    expect(
      assessConfiguredSecrets(
        {
          RBAC_JWT_SECRET: rotated,
          MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET: "a".repeat(20),
        },
        MCP_CHECKED_SECRET_NAMES,
      ),
    ).toEqual([
      { name: "RBAC_JWT_SECRET", verdict: "ok" },
      { name: "MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET", verdict: "short" },
    ]);
  });

  /**
   * BDD Scenario: A legacy RBAC value stops a service boot.
   */
  it("makes a legacy RBAC value held by Telegram fatal", () => {
    const findings = assessConfiguredSecrets(
      {
        RBAC_SECRET_KEY: legacyDigestOfZero,
        RBAC_JWT_SECRET: rotated,
        TELEGRAM_SERVICE_WEBHOOK_SECRET: legacyDigestOfMaximum,
      },
      TELEGRAM_CHECKED_SECRET_NAMES,
    );

    expect(findings.filter(isFatalSecretAssessment)).toEqual([
      { name: "RBAC_SECRET_KEY", verdict: "legacy" },
    ]);
    expect(findings).toContainEqual({
      name: "TELEGRAM_SERVICE_WEBHOOK_SECRET",
      verdict: "legacy",
    });
  });

  /**
   * BDD Scenario: An absent value does not stop a service boot.
   */
  it("finds nothing fatal for an MCP service without the operator secret", () => {
    expect(
      assessConfiguredSecrets(
        { RBAC_JWT_SECRET: rotated },
        MCP_CHECKED_SECRET_NAMES,
      ).filter(isFatalSecretAssessment),
    ).toEqual([]);
  });
});

describe("isFatalSecretAssessment", () => {
  /**
   * BDD Scenario: The authorization bypass and the token signing key stop a boot.
   */
  it("treats a legacy or missing RBAC secret as fatal", () => {
    expect(
      isFatalSecretAssessment({ name: "RBAC_SECRET_KEY", verdict: "legacy" }),
    ).toBe(true);
    expect(
      isFatalSecretAssessment({ name: "RBAC_JWT_SECRET", verdict: "missing" }),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Everything else is reported rather than fatal.
   */
  it("reports the remaining findings without stopping a boot", () => {
    expect(
      isFatalSecretAssessment({ name: "RBAC_SECRET_KEY", verdict: "short" }),
    ).toBe(false);
    expect(
      isFatalSecretAssessment({ name: "DATABASE_PASSWORD", verdict: "legacy" }),
    ).toBe(false);
    expect(
      isFatalSecretAssessment({ name: "RBAC_SECRET_KEY", verdict: "ok" }),
    ).toBe(false);
  });
});

describe("formatSecretAssessment", () => {
  /**
   * BDD Scenario: A report line names the key and the verdict.
   */
  it("names the key and what is wrong with it", () => {
    expect(
      formatSecretAssessment({ name: "RBAC_SECRET_KEY", verdict: "legacy" }),
    ).toContain("RBAC_SECRET_KEY");
    expect(
      formatSecretAssessment({ name: "RBAC_SECRET_KEY", verdict: "legacy" }),
    ).toContain("legacy");
    expect(
      formatSecretAssessment({ name: "KV_PASSWORD", verdict: "missing" }),
    ).toContain("missing");
    expect(
      formatSecretAssessment({ name: "KV_PASSWORD", verdict: "short" }),
    ).toContain("short");
  });

  /**
   * BDD Scenario: A report line never narrows a search for the value.
   */
  it("never repeats the value, a prefix of it, or its length", () => {
    for (const value of [legacyDigestOfZero, rotated, "a".repeat(20)]) {
      const line = formatSecretAssessment(
        assessSecret("RBAC_SECRET_KEY", value),
      );

      expect(line).not.toContain(value);
      expect(line).not.toContain(value.slice(0, 4));
      expect(line).not.toContain(`${value.length}`);
    }
  });
});
