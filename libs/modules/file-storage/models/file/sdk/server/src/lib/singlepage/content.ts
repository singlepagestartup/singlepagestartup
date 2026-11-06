import { serverHost, route } from "@sps/file-storage/models/file/sdk/model";
import { type NextRequestOptions, responsePipe } from "@sps/shared-utils";
export interface IProps {
  id: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
  signal?: AbortSignal;
}
export type IResult = Blob;
export async function action(props: IProps): Promise<IResult> {
  const requestOptions: NextRequestOptions = {
    ...props.options,
    next: { ...props.options?.next },
    signal: props.signal || props.options?.signal,
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { ...props.options?.headers, "Cache-Control": "no-store" },
  };
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/content`,
    requestOptions,
  );
  if (!res.ok) await responsePipe({ res });
  return (await res.blob()) as unknown as IResult;
}
