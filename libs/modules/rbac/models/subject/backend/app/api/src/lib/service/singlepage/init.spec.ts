/**
 * BDD Suite: anonymous session initialization.
 *
 * Given: a visitor calls session initialization with or without a token.
 * When: the presented token is a valid access token, absent, unusable, a
 * refresh token, revoked by a logout, or points to a subject that no longer
 * exists.
 * Then: a usable session is reused and every other case creates a subject,
 * without the token reaching any log, and the new pair names its types and
 * the subject id alone.
 */

const mockSubjectCreate = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  RBAC_JWT_SECRET: "test-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS: 2419200,
}));

jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectCreate(...args),
  },
}));

import * as jwt from "hono/jwt";
import { Service as Me } from "./me";
import { Service } from "./init";

const existingSubject = {
  id: "subject-existing",
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  variant: "default",
  slug: "existing-subject",
};

const createdSubject = {
  id: "subject-created",
  createdAt: new Date("2026-09-18T00:00:00.000Z"),
  updatedAt: new Date("2026-09-18T00:00:00.000Z"),
  variant: "default",
  slug: "created-subject",
};

async function signToken(props: {
  subjectId: string;
  expiresInSeconds: number;
  type?: "access" | "refresh";
  issuedAt?: number;
}) {
  const issuedAt = props.issuedAt ?? Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      exp: issuedAt + props.expiresInSeconds,
      iat: issuedAt,
      ...(props.type ? { typ: props.type } : {}),
      subject: { id: props.subjectId },
    },
    "test-jwt-secret",
  );
}

/**
 * Initialization resolves the presented token through the `me` service, so
 * the subject lookup below is the one `me` performs.
 */
function createService(props: {
  findById: jest.Mock;
  recordActivity: jest.Mock;
}) {
  return new Service({
    me: (meProps) => new Me({ findById: props.findById }).execute(meProps),
    recordActivity: props.recordActivity,
  });
}

describe("Given: a session initialization request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubjectCreate.mockResolvedValue(createdSubject);
  });

  /**
   * BDD Scenario: the caller holds a usable session.
   *
   * Given: a token signed by this installation for an existing subject.
   * When: initialization runs.
   * Then: the same subject is kept, its activity is recorded, and no subject
   * is inserted.
   */
  it("When: a valid token is presented Then: the subject is reused without an insert", async () => {
    const findById = jest.fn().mockResolvedValue(existingSubject);
    const recordActivity = jest.fn().mockResolvedValue(true);
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: existingSubject.id,
        expiresInSeconds: 3600,
      }),
    });

    expect(findById).toHaveBeenCalledWith({ id: existingSubject.id });
    expect(recordActivity).toHaveBeenCalledWith({ subject: existingSubject });
    expect(mockSubjectCreate).not.toHaveBeenCalled();
    expect(result.reused).toBe(true);
    expect(result.subject.id).toBe(existingSubject.id);
    expect(result.jwt).toEqual(expect.any(String));
    expect(result.refresh).toEqual(expect.any(String));
  });

  /**
   * BDD Scenario: a first visit.
   *
   * Given: no token on the request.
   * When: initialization runs.
   * Then: a subject is created through the module route, as the first-visit
   * contract requires.
   */
  it("When: no token is presented Then: a subject is created", async () => {
    const findById = jest.fn();
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });

    const result = await service.execute({});

    expect(findById).not.toHaveBeenCalled();
    expect(recordActivity).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledWith({
      data: {},
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(result.reused).toBe(false);
    expect(result.subject.id).toBe(createdSubject.id);
  });

  /**
   * BDD Scenario: the token cannot be trusted.
   *
   * Given: a malformed token.
   * When: initialization runs.
   * Then: a subject is created and the token value is never written to a log.
   */
  it("When: the token is malformed Then: a subject is created and the token is not logged", async () => {
    const findById = jest.fn();
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });
    const token = "malformed.token.value";

    const result = await service.execute({ token });

    expect(findById).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);

    const loggedArguments = [
      ...mockLoggerError.mock.calls,
      ...mockLoggerInfo.mock.calls,
    ].flat();

    expect(JSON.stringify(loggedArguments)).not.toContain(token);
  });

  /**
   * BDD Scenario: the session outlived its token.
   *
   * Given: a token that expired before the request.
   * When: initialization runs.
   * Then: a subject is created, because an expired token is not a session.
   */
  it("When: the token is expired Then: a subject is created", async () => {
    const findById = jest.fn();
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: existingSubject.id,
        expiresInSeconds: -60,
      }),
    });

    expect(findById).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
  });

  /**
   * BDD Scenario: the token outlived its subject.
   *
   * Given: a valid token whose subject was deleted by the retention job.
   * When: initialization runs.
   * Then: a subject is created instead of reusing an identifier that no longer
   * resolves.
   */
  it("When: the token subject no longer exists Then: a subject is created", async () => {
    const findById = jest.fn().mockResolvedValue(null);
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: "subject-deleted",
        expiresInSeconds: 3600,
      }),
    });

    expect(findById).toHaveBeenCalledWith({ id: "subject-deleted" });
    expect(recordActivity).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
  });

  /**
   * BDD Scenario: a session is reused and renewed.
   *
   * Given: an access token for an existing subject.
   * When: initialization runs.
   * Then: the new access and refresh tokens name their types and carry the
   * subject id alone, not the subject row.
   */
  it("When: a pair is issued Then: each token names its type and only the subject id", async () => {
    const findById = jest.fn().mockResolvedValue(existingSubject);
    const recordActivity = jest.fn().mockResolvedValue(true);
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: existingSubject.id,
        expiresInSeconds: 3600,
        type: "access",
      }),
    });

    const access = await jwt.verify(result.jwt, "test-jwt-secret");
    const refresh = await jwt.verify(result.refresh, "test-jwt-secret");

    expect(result.reused).toBe(true);
    expect(access).toMatchObject({ typ: "access" });
    expect(refresh).toMatchObject({ typ: "refresh" });
    expect(access.subject).toEqual({ id: existingSubject.id });
    expect(refresh.subject).toEqual({ id: existingSubject.id });
    expect(Number(refresh.exp) - Number(refresh.iat)).toBe(2419200);
  });

  /**
   * BDD Scenario: the caller presents its refresh token.
   *
   * Given: a valid refresh token for an existing subject.
   * When: initialization runs.
   * Then: a subject is created, because only an access token is a session
   * initialization can reuse.
   */
  it("When: a refresh token is presented Then: a subject is created", async () => {
    const findById = jest.fn().mockResolvedValue(existingSubject);
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: existingSubject.id,
        expiresInSeconds: 3600,
        type: "refresh",
      }),
    });

    expect(findById).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
  });

  /**
   * BDD Scenario: the session was logged out.
   *
   * Given: an unexpired access token signed before its subject logged out.
   * When: initialization runs.
   * Then: a subject is created, so a revoked token cannot be renewed into a
   * fresh pair for the subject it names.
   */
  it("When: the token was revoked by a logout Then: a subject is created", async () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const findById = jest.fn().mockResolvedValue({
      ...existingSubject,
      tokensValidAfter: new Date((issuedAt + 30) * 1000),
    });
    const recordActivity = jest.fn();
    const service = createService({ findById, recordActivity });

    const result = await service.execute({
      token: await signToken({
        subjectId: existingSubject.id,
        expiresInSeconds: 3600,
        type: "access",
        issuedAt,
      }),
    });

    expect(findById).toHaveBeenCalledWith({ id: existingSubject.id });
    expect(recordActivity).not.toHaveBeenCalled();
    expect(mockSubjectCreate).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
  });
});
