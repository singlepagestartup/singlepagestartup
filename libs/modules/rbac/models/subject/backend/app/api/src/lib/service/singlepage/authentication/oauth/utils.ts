import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_OAUTH_SUCCESS_REDIRECT_PATH,
} from "@sps/shared-utils";
import { api as rbacActionApi } from "@sps/rbac/models/action/sdk/server";

/**
 * Helpers for the OAuth services in this folder.
 *
 * `callback.ts`, `exchange.ts` and `start.ts` each export a `Service`; these
 * are free functions two of those services share, kept here so the folder does
 * not mix the two kinds. They stay beside the flow rather than moving to a
 * shared package because both know the shape of this flow and nothing outside
 * it uses them.
 */

/**
 * Redirect target normalisation for the OAuth flow, shared by the service that
 * stores a target and the service that uses one, so the two ends cannot drift.
 *
 * A prefix test is not enough here: `//host` and `/\host` both start with a
 * slash and both resolve to a foreign origin, and the callback used to hand a
 * session-granting exchange code to whatever origin came out.
 */

const CONTROL_CHARACTERS = /[\x00-\x1f\x7f]/;
const SINGLE_SLASH_PATH = /^\/(?!\/)/;

export function getHostRedirectOrigins(): string[] {
  try {
    return [new URL(NEXT_PUBLIC_HOST_SERVICE_URL).origin];
  } catch (error) {
    return [];
  }
}

/**
 * Returns the accepted target, or `undefined` when the candidate is not one.
 * The first allowed origin is the host the flow belongs to; a project that
 * genuinely redirects elsewhere widens the list through the service seam.
 */
export function normalizeRedirectTarget(props: {
  target: unknown;
  allowedOrigins: string[];
}): string | undefined {
  const { target, allowedOrigins } = props;
  const [hostOrigin] = allowedOrigins;

  if (!hostOrigin || typeof target !== "string" || !target) {
    return undefined;
  }

  // The URL parser folds a backslash into a slash for special schemes and
  // strips control characters, so both have to be refused before it runs.
  if (target.includes("\\") || CONTROL_CHARACTERS.test(target)) {
    return undefined;
  }

  let resolved: URL;

  try {
    resolved = new URL(target, hostOrigin);
  } catch (error) {
    return undefined;
  }

  if (!allowedOrigins.includes(resolved.origin)) {
    return undefined;
  }

  if (resolved.origin !== hostOrigin) {
    return resolved.toString();
  }

  // On the host origin only a path is accepted, so an absolute form carrying
  // credentials or a different port cannot pass by matching on origin alone.
  if (!SINGLE_SLASH_PATH.test(target)) {
    return undefined;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/**
 * The configured default runs through the same predicate: a misconfigured
 * `RBAC_OAUTH_SUCCESS_REDIRECT_PATH` must not become an off-origin default.
 */
export function resolveDefaultRedirectPath(props: {
  allowedOrigins: string[];
}): string {
  return (
    normalizeRedirectTarget({
      target: RBAC_OAUTH_SUCCESS_REDIRECT_PATH,
      allowedOrigins: props.allowedOrigins,
    }) || "/"
  );
}

export function resolveRedirectTarget(props: {
  target: unknown;
  allowedOrigins: string[];
}): string {
  return (
    normalizeRedirectTarget(props) ||
    resolveDefaultRedirectPath({ allowedOrigins: props.allowedOrigins })
  );
}

/**
 * Claims an OAuth action row - a state or an exchange code - exactly once.
 *
 * The "not consumed yet" test travels with the write, so two requests holding
 * the same state or the same code cannot both proceed. `null` is the loser's
 * answer, and the caller turns it into the already-consumed error it already
 * has for that case.
 */
export async function consumeOauthAction(props: {
  id: string;
  payload: { [key: string]: any };
  secretKey: string;
}) {
  const consumedAt = new Date().toISOString();

  return rbacActionApi.consume({
    id: props.id,
    data: {
      consumedAt,
      payload: {
        ...props.payload,
        oauth: {
          ...(props.payload["oauth"] || {}),
          // Written next to the column so an instance still running the
          // previous release, which only reads the payload, sees the mark too.
          consumedAt,
        },
      },
    },
    filters: {
      and: [
        {
          column: "consumedAt",
          method: "isNull",
        },
      ],
    },
    options: {
      headers: {
        "X-RBAC-SECRET-KEY": props.secretKey,
      },
    },
  });
}
