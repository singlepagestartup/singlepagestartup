import { notFound } from "next/navigation";
import { Component } from "@sps/host/models/page/frontend/component/src/lib/singlepage/ai-chat";
import { isAIChatRoute } from "@sps/host/models/page/frontend/component/src/lib/singlepage/ai-chat/utils";
export default async function AIChatRoute({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const url = "/ai-chat/" + path.join("/");
  if (!isAIChatRoute(url)) notFound();
  return <Component url={url} />;
}
