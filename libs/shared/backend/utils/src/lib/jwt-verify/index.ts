import * as jwt from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { type TJwtType } from "../jwt-sign";

const expiredTokenErrorName = "JwtTokenExpired";

/**
 * Hono names every JWT failure after its class. Only the token, header and
 * payload classes describe a credential the caller supplied; an unimplemented
 * algorithm is a server configuration fault and keeps its own message.
 */
const credentialErrorNamePattern = /^Jwt(Token|Header|Payload)/;

export interface IOptions {
  /**
   * The only token type the caller accepts. A token that names another type
   * is refused. A token without `typ` was signed before token types existed
   * and is accepted as either type until it expires.
   */
  type?: TJwtType;
}

/**
 * Verifies an RBAC JWT and converts Hono's verification failures into errors
 * with fixed messages. Hono interpolates the token into its own messages, so
 * the source error is replaced rather than wrapped: a cause would carry the
 * credential back into the error details, the stack and the response body.
 */
export async function util(
  token: string,
  secret: string,
  options?: IOptions,
): Promise<JWTPayload> {
  let payload: JWTPayload;

  try {
    payload = await jwt.verify(token, secret);
  } catch (error: any) {
    const name = error?.name;

    if (typeof name !== "string" || !credentialErrorNamePattern.test(name)) {
      throw error;
    }

    throw new Error(
      name === expiredTokenErrorName
        ? "Authentication error. Token expired"
        : "Authentication error. Invalid token",
    );
  }

  if (
    options?.type &&
    payload["typ"] !== undefined &&
    payload["typ"] !== options.type
  ) {
    throw new Error("Authentication error. Invalid token type");
  }

  return payload;
}
