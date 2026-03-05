import {
  serverHost,
  route,
  type IModel,
} from "@sps/rbac/models/permission/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { type IModel as IPermissionsToBillingModuleCurrencies } from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/model";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export interface IProps {
  host?: string;
  catchErrors?: boolean;
  tag?: string;
  revalidate?: number;
  params: {
    permission: {
      route: string;
      method: string;
      type?: "HTTP";
    };
    includeBillingRequirements?: boolean;
  };
  options?: Partial<NextRequestOptions>;
}

export type IResult = {
  permission?: IModel;
  rootPermission?: IModel;
  permissionsToBillingModuleCurrencies: IPermissionsToBillingModuleCurrencies[];
};

export async function action(props: IProps): Promise<IResult | undefined> {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { params, options, host = serverHost } = props;

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const noCache = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-store" }
    : {};

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    ...options,
    headers: {
      ...cacheControlOptions,
      ...options?.headers,
    },
    next: {
      tags: [route],
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/resolve-by-route?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
    catchErrors: props.catchErrors || productionBuild,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
