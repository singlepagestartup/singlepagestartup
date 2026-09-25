import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  HOST_SERVICE_REVALIDATION_SECRET,
  HOST_SERVICE_REVALIDATION_SECRET_HEADER,
} from "@sps/shared-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!HOST_SERVICE_REVALIDATION_SECRET) {
    console.warn(
      "[revalidate] HOST_SERVICE_REVALIDATION_SECRET is not set, so the host " +
        "refuses every revalidation request. Set the same value on the API " +
        "and the host, as described in tools/deployer/README.md.",
    );

    return unauthorized();
  }

  if (
    !revalidationSecretMatches(
      HOST_SERVICE_REVALIDATION_SECRET,
      request.headers.get(HOST_SERVICE_REVALIDATION_SECRET_HEADER),
    )
  ) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const path = searchParams.get("path");
  const type = searchParams.get("type");

  if (tag) {
    await revalidateTag(tag);
  }

  if (path) {
    if (type === "page" || type === "layout") {
      await revalidatePath(path, type);
    } else {
      await revalidatePath(path);
    }
  }

  return NextResponse.json({
    revalidated: {
      tag,
      path,
    },
    now: Date.now(),
  });
}

/**
 * One response for every refusal, so a caller cannot tell a missing
 * credential from a wrong one, or either from a host that has no secret
 * configured.
 */
function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Compares the caller's credential with the configured secret in constant
 * time. `timingSafeEqual` throws on buffers of different sizes, so the length
 * is compared first and is the one bit this comparison cannot hide. It repeats
 * `rbacSecretMatches` instead of importing it: that helper is bound to
 * `RBAC_SECRET_KEY`, a host route handler must not import `@sps/backend-utils`
 * (its barrel would bring the logger, the Bun WebSocket manager and the hono
 * context helpers into the Next server bundle, see #299), and
 * `@sps/shared-utils` cannot use node built-ins because client components
 * import it.
 */
function revalidationSecretMatches(
  secret: string,
  provided: string | null,
): boolean {
  if (!provided) {
    return false;
  }

  const expected = Buffer.from(secret, "utf8");
  const candidate = Buffer.from(provided, "utf8");

  return (
    expected.length === candidate.length && timingSafeEqual(expected, candidate)
  );
}
