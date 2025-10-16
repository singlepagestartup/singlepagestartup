import { factory } from "@sps/shared-frontend-server-api";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/session/sdk/model";

export type IProps = {};

export type IResult = {};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
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

    const res = await fetch(`${serverHost}${route}/init`, options);

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
