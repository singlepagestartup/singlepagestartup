import { route, serverHost } from "@sps/host/models/page/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

interface Params {
  url: string;
  language?: string;
  segment: string;
  catchErrors?: boolean;
  host?: string;
}

export async function action(props: Params) {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const { host = serverHost } = props;

  const noCache = productionBuild;

  const cacheControlOptions: NextRequestOptions["headers"] = noCache
    ? { "Cache-Control": "no-store" }
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
      url: props.url,
      language: props.language,
      segment: props.segment,
    },
    {
      encodeValuesOnly: true,
    },
  );

  const res = await fetch(
    `${host}${route}/url-segment-value?${stringifiedQuery}`,
    options,
  );

  const json = await responsePipe<{ data: string | null }>({
    res,
    catchErrors: props.catchErrors || productionBuild,
  });

  if (!json) {
    return null;
  }

  const transformedData = transformResponseItem<string | null>(json);

  return transformedData ?? null;
}
