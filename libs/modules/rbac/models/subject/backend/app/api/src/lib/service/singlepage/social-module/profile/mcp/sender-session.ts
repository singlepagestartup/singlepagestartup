import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { verifyJwt } from "@sps/backend-utils";
import { Provider } from "@sps/providers-kv";
import { KV_PROVIDER, RBAC_JWT_SECRET } from "@sps/shared-utils";

// A background job may run on another process. Keep the sender's original
// access token outside the conversation, bound to this message until expiry.
export class McpSenderSession {
  private readonly prefix = "rbac:mcp:sender";
  private readonly kv = new Provider({ type: KV_PROVIDER });

  private encryptionKey() {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }
    return createHmac("sha256", RBAC_JWT_SECRET).update(this.prefix).digest();
  }

  async save(messageId: string, subjectId: string, token: string) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }
    const claims = await verifyJwt(token, RBAC_JWT_SECRET, { type: "access" });
    if (
      claims.subject?.["id"] !== subjectId ||
      typeof claims.exp !== "number"
    ) {
      throw new Error(
        "Forbidden error. MCP requires the message sender's session",
      );
    }
    const ttl = claims.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) {
      return;
    }
    const key = JSON.stringify([messageId, subjectId]);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    cipher.setAAD(Buffer.from(key));
    const ciphertext = Buffer.concat([
      cipher.update(token, "utf8"),
      cipher.final(),
    ]);
    const value = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      "base64",
    );
    await this.kv.set({ prefix: this.prefix, key, value, options: { ttl } });
  }

  async read(messageId: string, subjectId: string) {
    const key = JSON.stringify([messageId, subjectId]);
    const value = await this.kv.get({ prefix: this.prefix, key });
    if (!value) {
      return;
    }
    const data = Buffer.from(value, "base64");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey(),
      data.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from(key));
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([
      decipher.update(data.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
  }
}
