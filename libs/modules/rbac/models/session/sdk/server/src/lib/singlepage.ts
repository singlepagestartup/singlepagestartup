import { factory } from "@sps/shared-frontend-server-api";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/session/sdk/model";

export const api = {
  ...factory<IModel>({
    route,
    host,
    params: query,
    options,
  }),
  init: async () => {
    const options: NextRequestOptions = {
      headers: {
        "Cache-Control": "no-store",
      },
      next: {
        cache: "no-store",
        tags: [route],
      },
    };

    const res = await fetch(`${host}${route}/init`, options);

    if (!res.ok) {
      const error = new Error(res.statusText);

      throw new Error(error.message || "Failed to fetch data");
    }

    const json = await responsePipe<{
      data: {
        ok: true;
      };
    }>({
      res,
    });

    const transformedData = transformResponseItem<{ ok: true }>(json);

    return transformedData;
  },
};
