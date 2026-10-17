import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONSISTENCY_REVALIDATION_BATCH_SIZE } from "@sps/shared-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 64 * 1024)
    return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
  let tags: unknown;
  try {
    tags = JSON.parse(raw).tags;
  } catch {
    return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
  }
  if (
    !Array.isArray(tags) ||
    tags.length > CONSISTENCY_REVALIDATION_BATCH_SIZE ||
    !tags.every(
      (tag) => typeof tag === "string" && tag.length > 0 && tag.length <= 512,
    )
  )
    return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
  const unique = [...new Set(tags as string[])];
  for (const tag of unique) revalidateTag(tag);
  return NextResponse.json({ revalidated: { tags: unique }, now: Date.now() });
}
