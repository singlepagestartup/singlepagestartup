import { signJwt } from "@sps/backend-utils";
import { McpSenderSession } from "./sender-session";

const records = new Map<string, string>();
const put = jest.fn(async ({ key, value }: { key: string; value: string }) => {
  records.set(key, value);
  return "OK";
});
jest.mock("@sps/providers-kv", () => ({
  Provider: class {
    get({ key }: { key: string }) {
      return Promise.resolve(records.get(key) ?? null);
    }
    set(props: { key: string; value: string }) {
      return put(props);
    }
  },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "unit-context-only",
}));

it("returns the exact access JWT only from storage bound to its sender and message", async () => {
  const session = new McpSenderSession();
  const token = await signJwt(
    { subjectId: "manager", type: "access", lifetimeInSeconds: 60 },
    "unit-context-only",
  );
  await session.save("question", "manager", token);
  expect(put).toHaveBeenCalledWith(
    expect.objectContaining({ options: { ttl: expect.any(Number) } }),
  );
  const [record] = records.values();
  expect(record).not.toContain(token);
  expect(await session.read("question", "manager")).toBe(token);
  expect(await session.read("different", "manager")).toBeUndefined();
  expect(await session.read("question", "employee")).toBeUndefined();
  records.set(JSON.stringify(["different", "manager"]), record);
  await expect(session.read("different", "manager")).rejects.toThrow();
});

it("refuses substitution of the sender and refresh credentials", async () => {
  const session = new McpSenderSession();
  const issue = (type: "access" | "refresh") =>
    signJwt(
      { subjectId: "manager", type, lifetimeInSeconds: 60 },
      "unit-context-only",
    );
  await expect(
    session.save("retry", "employee", await issue("access")),
  ).rejects.toThrow("sender");
  await expect(
    session.save("retry", "manager", await issue("refresh")),
  ).rejects.toThrow("token type");
});
