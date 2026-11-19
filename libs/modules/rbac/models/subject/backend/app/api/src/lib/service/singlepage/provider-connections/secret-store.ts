import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

interface ISecretRef {
  storeId: string;
  identityId: string;
  version: string;
}

export class ProviderSecretStore {
  private async location(ref: ISecretRef) {
    const root = process.env.SPS_PROVIDER_SECRET_DIR;
    if (!root || !path.isAbsolute(root)) {
      throw new Error(
        "Configuration error. Private provider secret directory is required",
      );
    }
    for (const id of [ref.storeId, ref.identityId, ref.version]) {
      z.uuid().parse(id);
    }
    await mkdir(root, { recursive: true, mode: 0o700 });
    const directory = await realpath(root);
    const publicRoots = [
      path.resolve("public"),
      path.resolve("apps/api/public"),
    ];
    if (
      publicRoots.some(
        (location) =>
          directory === location || directory.startsWith(location + path.sep),
      ) ||
      directory.split(path.sep).includes("public")
    ) {
      throw new Error(
        "Configuration error. Provider secret directory must be private",
      );
    }
    return path.join(
      directory,
      [ref.storeId, ref.identityId, ref.version].join("."),
    );
  }

  private masterKey(keyId: string) {
    let key: Buffer | undefined;
    try {
      const ring: Record<string, string> = JSON.parse(
        process.env.SPS_PROVIDER_MASTER_KEYS || "{}",
      );
      if (Object.hasOwn(ring, keyId)) {
        key = Buffer.from(ring[keyId], "base64");
      }
    } catch {
      throw new Error("Configuration error. Invalid provider master key ring");
    }
    if (key?.length !== 32) {
      throw new Error(
        "Configuration error. Provider master key version unavailable",
      );
    }
    return key;
  }

  async put(ref: ISecretRef, secret: string) {
    const file = await this.location(ref);
    const kid = process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY || "";
    const key = this.masterKey(kid);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(Buffer.from(path.basename(file)));
    const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    await writeFile(
      file,
      JSON.stringify({
        kid,
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        data: data.toString("base64"),
      }),
      { flag: "wx", mode: 0o600 },
    );
  }

  async read(ref: ISecretRef) {
    const file = await this.location(ref);
    try {
      const data = JSON.parse(await readFile(file, "utf8"));
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.masterKey(data.kid),
        Buffer.from(data.iv, "base64"),
      );
      decipher.setAAD(Buffer.from(path.basename(file)));
      decipher.setAuthTag(Buffer.from(data.tag, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(data.data, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new Error("Configuration error. Provider credential unavailable");
    }
  }
}
