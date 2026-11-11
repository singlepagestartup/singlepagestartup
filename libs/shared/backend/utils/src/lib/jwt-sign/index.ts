import { randomUUID } from "node:crypto";
import * as jwt from "hono/jwt";

/**
 * What an RBAC subject JWT is for. An access token authorizes requests; a
 * refresh token is accepted only by the refresh route, which exchanges it for
 * a new pair.
 */
export type TJwtType = "access" | "refresh";

export interface IProps {
  subjectId: string;
  type: TJwtType;
  lifetimeInSeconds: number;
}

/**
 * Signs an RBAC subject JWT. Every token carries the same claims: its type,
 * a unique id, its issue and expiry times, and the id of its subject - never
 * the rest of the subject row, which the token would otherwise freeze at
 * issue time.
 */
export async function util(props: IProps, secret: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      exp: issuedAt + props.lifetimeInSeconds,
      iat: issuedAt,
      jti: randomUUID(),
      typ: props.type,
      subject: {
        id: props.subjectId,
      },
    },
    secret,
  );
}
