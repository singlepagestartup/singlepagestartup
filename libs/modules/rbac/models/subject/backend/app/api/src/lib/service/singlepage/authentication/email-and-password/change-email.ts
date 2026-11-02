import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as actionApi } from "@sps/rbac/models/action/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import type { Service as SubjectService } from "../../index";

export interface IRequestProps {
  subjectId: string;
  identityId: string;
  data: { email?: string; verificationId?: string };
}
export interface IVerifyProps {
  subjectId: string;
  identityId: string;
  data: { challengeId: string; code: string };
}
interface IChallenge {
  type: "email-change-code" | "email-change-current-verified";
  subjectId: string;
  identityId: string;
  currentEmail: string;
  email: string;
  codeHash?: string;
  verificationId?: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}
  private options() {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    return {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
    };
  }
  private hash(value: string) {
    return createHmac("sha256", RBAC_SECRET_KEY!).update(value).digest("hex");
  }
  private async ownIdentity(subjectId: string, identityId: string) {
    const links = await this.service.subjectsToIdentities.find({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: subjectId },
            { column: "identityId", method: "eq", value: identityId },
          ],
        },
      },
    });
    if (!links.length)
      throw new Error(
        "Authorization error. The identity does not belong to this Subject",
      );
    const identity = await this.service.identity.findById({ id: identityId });
    if (!identity?.email || identity.provider !== "email_and_password")
      throw new Error(
        "Validation error. An email and password identity is required",
      );
    return identity;
  }
  private async readAction(
    id: string,
    identity: { id: string; email: string | null },
    subjectId: string,
    type: IChallenge["type"],
  ) {
    const action = await actionApi
      .findById({ id, options: this.options() })
      .catch(() => null);
    const payload = action?.payload as IChallenge | undefined;
    if (
      !action ||
      action.consumedAt ||
      new Date(action.expiresAt).getTime() <= Date.now() ||
      payload?.type !== type ||
      payload.subjectId !== subjectId ||
      payload.identityId !== identity.id ||
      payload.currentEmail !== identity.email
    ) {
      throw new Error(
        "Validation error. This verification has expired. Request a new code.",
      );
    }
    return { action, payload };
  }
  private async consume(id: string) {
    const claimed = await actionApi.consume({
      id,
      data: { consumedAt: new Date().toISOString() },
      filters: {
        and: [
          { column: "consumedAt", method: "isNull" },
          {
            column: "expiresAt",
            method: "gt",
            value: new Date().toISOString(),
          },
        ],
      },
      options: this.options(),
    });
    if (!claimed)
      throw new Error(
        "Validation error. This verification was already used. Request a new code.",
      );
  }
  private rateId(subjectId: string, identityId: string, stage: string) {
    const value = this.hash(
      `${subjectId}:${identityId}:${stage}:${Math.floor(Date.now() / 60000)}`,
    );
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-a${value.slice(17, 20)}-${value.slice(20, 32)}`;
  }
  async request(props: IRequestProps) {
    this.options();
    const identity = await this.ownIdentity(props.subjectId, props.identityId);
    let email = identity.email!;
    let verificationId: string | undefined;
    if (props.data.email !== undefined) {
      email = z
        .string()
        .trim()
        .email()
        .max(254)
        .parse(props.data.email)
        .toLowerCase();
      if (email === identity.email!.toLowerCase())
        throw new Error("Validation error. Enter a different email address.");
      if (!props.data.verificationId)
        throw new Error("Validation error. Verify your current email first.");
      await this.readAction(
        props.data.verificationId,
        identity,
        props.subjectId,
        "email-change-current-verified",
      );
      verificationId = props.data.verificationId;
      const duplicates = await this.service.identity.find({
        params: {
          filters: {
            and: [
              { column: "email", method: "eq", value: email },
              { column: "provider", method: "eq", value: "email_and_password" },
            ],
          },
        },
      });
      if (duplicates.length)
        throw new Error(
          "Conflict error. This email address is already in use.",
        );
    }
    const challengeId = this.rateId(
      props.subjectId,
      props.identityId,
      verificationId ? "new" : "current",
    );
    const recent = await actionApi
      .findById({ id: challengeId, options: this.options() })
      .catch(() => null);
    if (recent)
      throw new Error(
        "Validation error. Wait one minute before requesting another code.",
      );
    const code = String(randomInt(100000, 1000000));
    const payload: IChallenge = {
      type: "email-change-code",
      subjectId: props.subjectId,
      identityId: identity.id,
      currentEmail: identity.email!,
      email,
      verificationId,
      codeHash: this.hash(`${challengeId}:${code}`),
    };
    const action = await actionApi.create({
      data: {
        id: challengeId,
        payload,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      },
      options: this.options(),
    });
    try {
      await this.service.notificationModule.notification.sendVerificationCode({
        email,
        code,
      });
    } catch (error) {
      await actionApi.delete({ id: action.id, options: this.options() });
      throw error;
    }
    return { challengeId: action.id, email, expiresInSeconds: 600 };
  }
  async verify(props: IVerifyProps) {
    this.options();
    const identity = await this.ownIdentity(props.subjectId, props.identityId);
    if (
      !z.string().uuid().safeParse(props.data.challengeId).success ||
      !/^\d{6}$/.test(props.data.code)
    )
      throw new Error(
        "Validation error. Enter the six-digit verification code.",
      );
    const { action, payload } = await this.readAction(
      props.data.challengeId,
      identity,
      props.subjectId,
      "email-change-code",
    );
    await this.consume(action.id);
    const actual = Buffer.from(
      this.hash(`${action.id}:${props.data.code}`),
      "hex",
    );
    const expected = Buffer.from(payload.codeHash || "", "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new Error(
        "Validation error. That code is incorrect. Request a new code.",
      );
    if (!payload.verificationId) {
      const proof = await actionApi.create({
        data: {
          id: randomUUID(),
          payload: {
            type: "email-change-current-verified",
            subjectId: props.subjectId,
            identityId: identity.id,
            currentEmail: identity.email!,
            email: identity.email!,
          },
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
        options: this.options(),
      });
      return { stage: "current-verified" as const, verificationId: proof.id };
    }
    await this.readAction(
      payload.verificationId,
      identity,
      props.subjectId,
      "email-change-current-verified",
    );
    await this.consume(payload.verificationId);
    await identityApi.update({
      id: identity.id,
      data: { email: payload.email },
      options: this.options(),
    });
    const updated = await this.service.identity.findById({ id: identity.id });
    return { stage: "complete" as const, identity: updated };
  }
}
