/**
 * BDD Suite: subject token revocation by the tokensValidAfter mark.
 *
 * Given: a subject whose logout wrote a tokensValidAfter instant, or none.
 * When: a token's issue time is compared with that instant.
 * Then: tokens signed in or before the second of the mark are revoked and
 * tokens signed in a later second are not.
 */

import { isRbacSubjectTokenRevoked } from "./token-revocation";

const markInMilliseconds = Date.parse("2026-09-26T10:00:00.400Z");
const markSecond = Math.floor(markInMilliseconds / 1000);

describe("Given: a subject token and the subject's revocation mark", () => {
  /**
   * BDD Scenario
   * Given: a subject that has never logged out.
   * When: any token of it is checked.
   * Then: it is not revoked.
   */
  it("When: the subject has no mark Then: the token is not revoked", () => {
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: null },
        issuedAt: markSecond - 3600,
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a token signed an hour before the logout.
   * When: it is checked against the mark.
   * Then: it is revoked.
   */
  it("When: the token was signed before the mark Then: it is revoked", () => {
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: new Date(markInMilliseconds) },
        issuedAt: markSecond - 3600,
      }),
    ).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: a token whose iat is the second in which logout ran, which includes
   * a token refreshed a moment before the logout.
   * When: it is checked against the mark.
   * Then: it is revoked, because iat cannot tell the two moments apart.
   */
  it("When: the token was signed in the second of the mark Then: it is revoked", () => {
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: new Date(markInMilliseconds) },
        issuedAt: markSecond,
      }),
    ).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: a token signed in the second after the logout, such as a new login.
   * When: it is checked against the mark.
   * Then: it is not revoked.
   */
  it("When: the token was signed in a later second Then: it is not revoked", () => {
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: new Date(markInMilliseconds) },
        issuedAt: markSecond + 1,
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: the mark as it arrives in a JSON response, an ISO string.
   * When: tokens on either side of it are checked.
   * Then: the string is read as the same instant.
   */
  it("When: the mark is an ISO string Then: it is compared as a date", () => {
    const tokensValidAfter = new Date(markInMilliseconds).toISOString();

    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter },
        issuedAt: markSecond,
      }),
    ).toBe(true);
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter },
        issuedAt: markSecond + 1,
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a mark, and a token without iat or a mark that is not a date.
   * When: the token is checked.
   * Then: it is revoked, because it cannot be placed after the mark.
   */
  it("When: the issue time or the mark cannot be read Then: the token is revoked", () => {
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: new Date(markInMilliseconds) },
      }),
    ).toBe(true);
    expect(
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter: "not-a-date" },
        issuedAt: markSecond + 1,
      }),
    ).toBe(true);
  });
});
