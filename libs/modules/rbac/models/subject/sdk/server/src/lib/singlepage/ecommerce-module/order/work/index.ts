import {
  orderArtifactPath,
  orderWorkPath,
  serverHost,
  type IOrderWorkScope,
  type IOrderWorkView,
  type TOrderWorkDecision,
} from "@sps/rbac/models/subject/sdk/model";
import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";

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
  host = serverHost,
  options,
}: IContentProps) {
  const res = await fetch(
    `${host}${orderArtifactPath(id, orderId, artifactId)}`,
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
  return res.blob();
}

export const orderWork = { read, decision, content };
