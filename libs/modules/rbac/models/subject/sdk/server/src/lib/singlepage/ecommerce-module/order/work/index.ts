import {
  orderArtifactKnowledgePath,
  orderArtifactPath,
  orderWorkPath,
  serverHost,
  type IOrderWorkScope,
  type IOrderWorkView,
  type IOrderArtifactKnowledge,
  type TOrderWorkDecision,
} from "@sps/rbac/models/subject/sdk/model";
import {
  readChatAttachmentBlob,
  responsePipe,
  type NextRequestOptions,
} from "@sps/shared-utils";

interface IRequest {
  id: string;
  orderId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export interface IReadProps extends IRequest, IOrderWorkScope {}
export interface IDecisionProps extends IRequest {
  data: TOrderWorkDecision;
}
export interface IContentProps extends IRequest {
  artifactId: string;
  maxBytes?: number;
  storeId?: string;
}
export interface IKnowledgeProps extends IRequest {
  artifactId: string;
  method: "POST" | "DELETE";
}

async function read({
  id,
  orderId,
  storeId,
  taskId,
  host = serverHost,
  options,
}: IReadProps): Promise<IOrderWorkView> {
  const query = new URLSearchParams({ storeId, taskId });
  const res = await fetch(`${host}${orderWorkPath(id, orderId)}?${query}`, {
    ...options,
    credentials: "include",
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  } as NextRequestOptions);
  const answer = await responsePipe<{ data: IOrderWorkView }>({ res });
  if (!answer?.data) {
    throw new Error("Order work returned no data");
  }
  return answer.data;
}

async function decision({
  id,
  orderId,
  data,
  host = serverHost,
  options,
}: IDecisionProps): Promise<IOrderWorkView> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${host}${orderWorkPath(id, orderId)}`, {
    ...options,
    credentials: "include",
    method: "POST",
    headers,
    body: JSON.stringify(data),
    cache: "no-store",
  });
  const answer = await responsePipe<{ data: IOrderWorkView }>({ res });
  if (!answer?.data) {
    throw new Error("Order work returned no data");
  }
  return answer.data;
}

async function content({
  id,
  orderId,
  artifactId,
  maxBytes,
  storeId,
  host = serverHost,
  options,
}: IContentProps) {
  const res = await fetch(
    `${host}${orderArtifactPath(id, orderId, artifactId)}${storeId ? "?" + new URLSearchParams({ storeId }) : ""}`,
    {
      ...options,
      credentials: "include",
      method: "GET",
      cache: "no-store",
    },
  );
  if (!res.ok) {
    await responsePipe({ res });
    throw new Error("Order artifact could not be read");
  }
  return readChatAttachmentBlob(res, maxBytes);
}

async function setArtifactKnowledge({
  id,
  orderId,
  artifactId,
  method,
  host = serverHost,
  options,
}: IKnowledgeProps): Promise<IOrderArtifactKnowledge> {
  const res = await fetch(
    `${host}${orderArtifactKnowledgePath(id, orderId, artifactId)}`,
    { ...options, credentials: "include", method, cache: "no-store" },
  );
  const answer = await responsePipe<{ data: IOrderArtifactKnowledge }>({ res });
  if (!answer?.data) {
    throw new Error("Order result Knowledge returned no data");
  }
  return answer.data;
}

export const orderWork = { read, decision, content, setArtifactKnowledge };
