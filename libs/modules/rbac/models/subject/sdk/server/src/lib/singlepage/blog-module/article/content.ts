import {
  serverHost,
  route,
  type IArticleContentResult,
} from "@sps/rbac/models/subject/sdk/model";
import {
  type NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
export interface IProps {
  id: string;
  blogModuleArticleId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export type IResult = IArticleContentResult;
export async function action(props: IProps): Promise<IResult> {
  const requestOptions: NextRequestOptions = {
    ...props.options,
    next: { ...props.options?.next },
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { ...props.options?.headers, "Cache-Control": "no-store" },
  };
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/blog-module/articles/${props.blogModuleArticleId}/content`,
    requestOptions,
  );
  return transformResponseItem<IResult>(
    await responsePipe<{ data: IResult }>({ res }),
  );
}
