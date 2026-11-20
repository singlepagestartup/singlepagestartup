import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ProviderSecretStore } from "./secret-store";
const settings = [
  "SPS_PROVIDER_ACTIVE_MASTER_KEY",
  "SPS_PROVIDER_MASTER_KEYS",
  "SPS_PROVIDER_SECRET_DIR",
] as const;
const original = settings.map((key) => process.env[key]);
let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "sps-test-secret-"));
  process.env.SPS_PROVIDER_SECRET_DIR = directory;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "v1";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    v1: randomBytes(32).toString("base64"),
  });
});
afterEach(async () => {
  settings.forEach((key, i) => {
    if (original[i] === undefined) delete process.env[key];
    else process.env[key] = original[i];
  });
  await rm(directory, { recursive: true, force: true });
});
it("stores an authenticated, write-once ciphertext bound to the store, identity and version", async () => {
  const store = new ProviderSecretStore();
  const ref = {
    storeId: randomUUID(),
    identityId: randomUUID(),
    version: randomUUID(),
  };
  await store.put(ref, "test-credential-418");
  const bytes = await readFile(
    path.join(directory, Object.values(ref).join(".")),
    "utf8",
  );
  expect(bytes).not.toContain("test-credential-418");
  expect(await store.read(ref)).toBe("test-credential-418");
  await expect(store.put(ref, "different-credential")).rejects.toThrow();
  await expect(store.read({ ...ref, version: randomUUID() })).rejects.toThrow(
    "unavailable",
  );
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    v1: randomBytes(32).toString("base64"),
  });
  await expect(store.read(ref)).rejects.toThrow("unavailable");
});
