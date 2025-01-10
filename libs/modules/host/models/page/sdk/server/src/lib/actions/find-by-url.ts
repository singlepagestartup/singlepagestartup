import { route, IModel, host } from "@sps/host/models/page/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

interface Params {
  url: string;
  catchErrors?: boolean;
}

export async function action({ url, catchErrors = false }: Params) {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const noCache = productionBuild;

  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-cache" }
    : {};

  const options: NextRequestOptions = {
    headers: {
      ...cacheControlOptions,
    },
    next: {
      tags: [route],
    },
  };

  const stringifiedQuery = QueryString.stringify(
    {
      url,
    },
    {
      encodeValuesOnly: true,
    },
  );

  const res = await fetch(
    `${host}${route}/find-by-url?${stringifiedQuery}`,
    options,
  );

  const json = await responsePipe<{ data: IModel }>({
    res,
    catchErrors: catchErrors || productionBuild,
  });

  if (!json) {
    return;
  }

  const transformedData = transformResponseItem<IModel>(json);

  if (!transformedData?.id) {
    return;
  }

  return transformedData;
}
