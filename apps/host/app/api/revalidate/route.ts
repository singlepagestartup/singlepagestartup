import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

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
