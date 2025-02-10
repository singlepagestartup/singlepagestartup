import { route, IModel, host } from "@sps/host/models/page/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { logger } from "@sps/backend-utils";

export async function action(props: { catchErrors?: boolean }) {
  try {
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

    const res = await fetch(`${host}${route}/urls`, options);

    const json = await responsePipe<{
      data: IModel & { urls: { url: string }[] };
    }>({
      res,
      catchErrors: props.catchErrors || productionBuild,
    });

    if (!json) {
      return;
    }

    const transformedData = transformResponseItem<
      IModel & {
        urls: { url: string }[];
      }
    >(json);

    const paths =
      transformedData?.urls?.map((pageParams: { url: string }) => {
        return {
          ...pageParams,
          url:
            pageParams.url === "/"
              ? []
              : pageParams.url.split("/").filter((p) => p !== ""),
        };
      }) || [];

    return paths;
  } catch (error) {
    logger.error(error);
    return [];
  }
}
