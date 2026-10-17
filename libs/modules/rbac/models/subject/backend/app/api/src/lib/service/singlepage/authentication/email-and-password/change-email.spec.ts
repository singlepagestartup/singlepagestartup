const mockActions = new Map<string, any>();
const mockSend = jest.fn();
const mockUpdate = jest.fn();
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "unit-test-secret" }));
jest.mock("@sps/rbac/models/action/sdk/server", () => ({
  api: {
    findById: jest.fn(async ({ id }: any) => mockActions.get(id)),
    create: jest.fn(async ({ data }: any) => {
      if (mockActions.has(data.id)) throw new Error("Conflict error");
      mockActions.set(data.id, { ...data, consumedAt: null });
      return mockActions.get(data.id);
    }),
    consume: jest.fn(async ({ id, data }: any) => {
      const row = mockActions.get(id);
      if (!row || row.consumedAt) return null;
      Object.assign(row, data);
      return row;
    }),
    delete: jest.fn(async ({ id }: any) => mockActions.delete(id)),
  },
}));
jest.mock("@sps/rbac/models/identity/sdk/server", () => ({
  api: { update: (props: any) => mockUpdate(props) },
}));
import { Service } from "./change-email";

function example() {
  const identity = {
    id: "identity",
    email: "old@example.com",
    provider: "email_and_password",
  };
  mockUpdate.mockImplementation(async ({ data }: any) =>
    Object.assign(identity, data),
  );
  const deps = {
    subjectsToIdentities: {
      find: jest.fn(async ({ params }: any) =>
        params.filters.and[0].value === "owner"
          ? [{ identityId: "identity" }]
          : [],
      ),
    },
    identity: {
      findById: jest.fn(async () => identity),
      find: jest.fn(async () => []),
    },
    notificationModule: { notification: { sendVerificationCode: mockSend } },
  };
  return { service: new Service(deps as any), identity };
}
beforeEach(() => {
  mockActions.clear();
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ sent: true });
});

it("changes the address only after a real delivery and both single-use email codes are verified", async () => {
  const { service, identity } = example();
  const first = await service.request({
    subjectId: "owner",
    identityId: "identity",
    data: {},
  });
  expect(mockSend.mock.calls[0][0].email).toBe("old@example.com");
  expect((first as any).code).toBeUndefined();
  const proof = await service.verify({
    subjectId: "owner",
    identityId: "identity",
    data: {
      challengeId: first.challengeId,
      code: mockSend.mock.calls[0][0].code,
    },
  });
  expect(proof.stage).toBe("current-verified");
  expect(mockUpdate).not.toHaveBeenCalled();
  const second = await service.request({
    subjectId: "owner",
    identityId: "identity",
    data: {
      email: "NEW@example.com",
      verificationId: (proof as any).verificationId,
    },
  });
  expect(mockSend.mock.calls[1][0].email).toBe("new@example.com");
  const result = await service.verify({
    subjectId: "owner",
    identityId: "identity",
    data: {
      challengeId: second.challengeId,
      code: mockSend.mock.calls[1][0].code,
    },
  });
  expect(result.stage).toBe("complete");
  expect(identity.email).toBe("new@example.com");
  await expect(
    service.verify({
      subjectId: "owner",
      identityId: "identity",
      data: {
        challengeId: second.challengeId,
        code: mockSend.mock.calls[1][0].code,
      },
    }),
  ).rejects.toThrow();
  expect(mockUpdate).toHaveBeenCalledTimes(1);
});

it("rejects a foreign Subject before sending mail or consuming a challenge", async () => {
  const { service } = example();
  await expect(
    service.request({ subjectId: "foreign", identityId: "identity", data: {} }),
  ).rejects.toThrow("does not belong");
  expect(mockSend).not.toHaveBeenCalled();
});

it("rejects a new address without proof of the current address", async () => {
  const { service } = example();
  await expect(
    service.request({
      subjectId: "owner",
      identityId: "identity",
      data: { email: "new@example.com" },
    }),
  ).rejects.toThrow("current email first");
  expect(mockSend).not.toHaveBeenCalled();
});

it("expires codes and consumes a failed code so it cannot be brute-forced", async () => {
  const { service } = example();
  const sent = await service.request({
    subjectId: "owner",
    identityId: "identity",
    data: {},
  });
  const code = mockSend.mock.calls[0][0].code;
  const incorrect = code === "111111" ? "222222" : "111111";
  await expect(
    service.verify({
      subjectId: "owner",
      identityId: "identity",
      data: { challengeId: sent.challengeId, code: incorrect },
    }),
  ).rejects.toThrow("incorrect");
  await expect(
    service.verify({
      subjectId: "owner",
      identityId: "identity",
      data: { challengeId: sent.challengeId, code },
    }),
  ).rejects.toThrow("expired");
  expect(mockUpdate).not.toHaveBeenCalled();
  mockActions.get(sent.challengeId).consumedAt = null;
  mockActions.get(sent.challengeId).expiresAt = new Date(0).toISOString();
  await expect(
    service.verify({
      subjectId: "owner",
      identityId: "identity",
      data: { challengeId: sent.challengeId, code },
    }),
  ).rejects.toThrow("expired");
});

it("limits sends and rolls back a challenge if delivery fails", async () => {
  const { service } = example();
  mockSend.mockRejectedValueOnce(new Error("Delivery unavailable"));
  await expect(
    service.request({ subjectId: "owner", identityId: "identity", data: {} }),
  ).rejects.toThrow("Delivery unavailable");
  expect(mockActions.size).toBe(0);
  await service.request({
    subjectId: "owner",
    identityId: "identity",
    data: {},
  });
  await expect(
    service.request({ subjectId: "owner", identityId: "identity", data: {} }),
  ).rejects.toThrow("Wait one minute");
});
