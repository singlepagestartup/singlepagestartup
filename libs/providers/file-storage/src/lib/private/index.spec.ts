import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrivateDirectory } from "./index";

const previous = process.env.FILE_STORAGE_PRIVATE_DIRECTORY;
let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "sps-private-storage-"));
  process.env.FILE_STORAGE_PRIVATE_DIRECTORY = path.join(
    directory,
    "protected",
  );
});

afterEach(async () => {
  if (previous === undefined) {
    delete process.env.FILE_STORAGE_PRIVATE_DIRECTORY;
  } else {
    process.env.FILE_STORAGE_PRIVATE_DIRECTORY = previous;
  }
  await rm(directory, { recursive: true, force: true });
});

it("retries a durable write and detects a changed file", async () => {
  const store = new PrivateDirectory();
  const bytes = Buffer.from("private");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const id = randomUUID();
  await store.write(id, bytes, digest);
  await store.write(id, bytes, digest);
  expect(await store.read(id, digest, bytes.length)).toEqual(bytes);
  await writeFile(
    path.join(directory, "protected", id),
    Buffer.from("changed"),
  );
  await expect(store.read(id, digest, bytes.length)).rejects.toThrow(
    "checksum",
  );
});

it("rejects public paths and a symlink that resolves into public storage", async () => {
  const store = new PrivateDirectory();
  const bytes = Buffer.from("private");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const publicPath = path.join(directory, "public");
  await mkdir(publicPath);
  const alias = path.join(directory, "alias");
  await symlink(publicPath, alias);
  const id = randomUUID();
  for (const candidate of [publicPath, alias]) {
    process.env.FILE_STORAGE_PRIVATE_DIRECTORY = candidate;
    await expect(store.write(id, bytes, digest)).rejects.toThrow("public");
  }
  await expect(readFile(path.join(publicPath, id))).rejects.toMatchObject({
    code: "ENOENT",
  });
});
