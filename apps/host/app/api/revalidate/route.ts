import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CONSISTENCY_REVALIDATION_BATCH_SIZE,
  HOST_SERVICE_REVALIDATION_SECRET,
  HOST_SERVICE_REVALIDATION_SECRET_HEADER,
} from "@sps/shared-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  if (!HOST_SERVICE_REVALIDATION_SECRET) {
    console.warn(
      "[revalidate] HOST_SERVICE_REVALIDATION_SECRET is not configured",
    );
    return false;
  }
  const provided = request.headers.get(HOST_SERVICE_REVALIDATION_SECRET_HEADER);
  if (!provided) return false;
  const expected = Buffer.from(HOST_SERVICE_REVALIDATION_SECRET);
  const candidate = Buffer.from(provided);
  return (
    expected.length === candidate.length && timingSafeEqual(expected, candidate)
  );
}

function invalidRequest() {
  return NextResponse.json(
    { error: "Invalid revalidation request" },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > 64 * 1024) return invalidRequest();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return invalidRequest();
  }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return invalidRequest();
  const { tags = [], path, type } = body as Record<string, unknown>;
  if (
    !Array.isArray(tags) ||
    tags.length > CONSISTENCY_REVALIDATION_BATCH_SIZE ||
    !tags.every(
      (tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 512,
    ) ||
    (!tags.length && path === undefined) ||
    (path !== undefined &&
      (typeof path !== "string" ||
        path.length > 1024 ||
        !path.startsWith("/") ||
        path.startsWith("//") ||
        /[?#\\]/.test(path))) ||
    (type !== undefined &&
      (path === undefined || (type !== "page" && type !== "layout")))
  )
    return invalidRequest();

  const unique = [...new Set(tags)];
  for (const tag of unique) revalidateTag(tag, { expire: 0 });
  if (typeof path === "string") await revalidatePath(path, type);
  return NextResponse.json({
    revalidated: { tags: unique, path },
    now: Date.now(),
  });
}
