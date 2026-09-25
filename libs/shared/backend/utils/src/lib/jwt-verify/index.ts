import * as jwt from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { RBAC_JWT_ALGORITHM } from "@sps/shared-utils";

const expiredTokenErrorName = "JwtTokenExpired";

/**
 * Hono names every JWT failure after its class. Only the token, header and
 * payload classes, and the mismatch between the header's algorithm and the
 * expected one, describe a credential the caller supplied; an unimplemented or
 * missing algorithm is a server configuration fault and keeps its own message.
 */
const credentialErrorNamePattern =
  /^Jwt(Token|Header|Payload|AlgorithmMismatch)/;

/**
 * Verifies an RBAC JWT and converts Hono's verification failures into errors
 * with fixed messages. Hono interpolates the token into its own messages, so
 * the source error is replaced rather than wrapped: a cause would carry the
 * credential back into the error details, the stack and the response body.
 */
export async function util(token: string, secret: string): Promise<JWTPayload> {
  try {
    return await jwt.verify(token, secret, RBAC_JWT_ALGORITHM);
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
}
