import {
  route,
  serverHost,
  customerWorkAttachmentPath,
  customerWorkTelegramRatePath,
  type ICustomerWorkScope,
  type ICustomerWorkView,
  type TCustomerWorkCommand,
  type ICustomerWorkOfferScope,
  type ICustomerWorkOfferAvailability,
  type ICustomerWorkTelegramRateRequest,
} from "@sps/rbac/models/subject/sdk/model";
import {
  readChatAttachmentBlob,
  responsePipe,
  type NextRequestOptions,
} from "@sps/shared-utils";

interface IRequest {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export interface IReadProps extends IRequest, ICustomerWorkScope {}
export interface IAvailabilityProps extends IRequest, ICustomerWorkOfferScope {}
export interface IOrderProps extends IRequest {
  storeId: string;
  orderId: string;
}
export interface IThreadProps extends IRequest {
  threadId: string;
}
export interface IAttachmentProps extends IThreadProps {
  messageId: string;
  attachmentId: string;
  maxBytes?: number;
}
export interface ICommandProps extends IRequest {
  data: TCustomerWorkCommand;
}

export interface ITelegramRateProps extends Omit<IRequest, "id"> {
  data: ICustomerWorkTelegramRateRequest;
}

function endpoint(host: string, id: string, storeId: string) {
  return `${host}${route}/${encodeURIComponent(id)}/stores/${encodeURIComponent(storeId)}/customer-work`;
}

async function read<T>(
  props: IRequest & { storeId: string },
  params: Record<string, string>,
): Promise<T> {
  const { id, storeId, host = serverHost, options } = props;
  const query = new URLSearchParams(params);
  const res = await fetch(`${endpoint(host, id, storeId)}?${query}`, {
    credentials: "include",
    ...options,
    cache: "no-store",
    method: "GET",
    next: { revalidate: 0 },
  } as NextRequestOptions);
  const json = await responsePipe<{ data: T }>({ res });
  if (!json || !("data" in json)) {
    throw new Error("Customer work returned no data");
  }
  return json.data;
}

export function customerWork(props: IReadProps) {
  return read<ICustomerWorkView>(props, { taskId: props.taskId });
}

export function customerWorkAvailability(props: IAvailabilityProps) {
  return read<ICustomerWorkOfferAvailability>(props, {
    offerId: props.offerId,
    productId: props.productId,
  });
}

export function customerWorkForOrder(props: IOrderProps) {
  return read<ICustomerWorkView | null>(props, { orderId: props.orderId });
}

export async function customerWorkForThread({
  id,
  threadId,
  host = serverHost,
  options,
}: IThreadProps) {
  const res = await fetch(
    `${host}${route}/${encodeURIComponent(id)}/customer-work/threads/${encodeURIComponent(threadId)}`,
    {
      credentials: "include",
      ...options,
      cache: "no-store",
      method: "GET",
    },
  );
  const json = await responsePipe<{ data: ICustomerWorkView }>({ res });
  if (!json?.data) {
    throw new Error("Customer work returned no data");
  }
  return json.data;
}

export async function customerWorkAttachment({
  id,
  threadId,
  messageId,
  attachmentId,
  maxBytes,
  host = serverHost,
  options,
}: IAttachmentProps) {
  const path = customerWorkAttachmentPath(
    id,
    threadId,
    messageId,
    attachmentId,
  );
  const res = await fetch(`${host}${path}`, {
    credentials: "include",
    ...options,
    cache: "no-store",
    method: "GET",
  });
  if (!res.ok) {
    await responsePipe({ res });
    throw new Error("Message attachment is unavailable");
  }
  return readChatAttachmentBlob(res, maxBytes);
}

export async function changeCustomerWork({
  id,
  data,
  host = serverHost,
  options,
}: ICommandProps): Promise<ICustomerWorkView> {
  const headers = new Headers(options?.headers);
  headers.set("content-type", "application/json");
  const res = await fetch(endpoint(host, id, data.storeId), {
    credentials: "include",
    ...options,
    headers,
    cache: "no-store",
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await responsePipe<{ data: ICustomerWorkView }>({ res });
  if (!json?.data) {
    throw new Error("Customer work returned no data");
  }
  return json.data;
}

export async function approveCustomerWorkTelegramRate({
  data,
  host = serverHost,
  options,
}: ITelegramRateProps): Promise<void> {
  const headers = new Headers(options?.headers);
  headers.set("content-type", "application/json");
  const res = await fetch(`${host}${route}${customerWorkTelegramRatePath}`, {
    ...options,
    headers,
    cache: "no-store",
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await responsePipe({ res });
  }
}
