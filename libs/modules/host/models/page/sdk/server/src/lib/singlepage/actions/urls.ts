import { route, IModel, serverHost } from "@sps/host/models/page/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
// Imported from its own path rather than the package barrel: the barrel also
// re-exports the operator-credential helpers, which pull node:crypto into a
// module the host bundles for the browser.
import { util as logger } from "@sps/backend-utils/logger";

export async function action(props: { catchErrors?: boolean; host?: string }) {
  try {
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
