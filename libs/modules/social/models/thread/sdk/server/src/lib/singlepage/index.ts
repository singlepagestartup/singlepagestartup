import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
  type IThreadMetadataNamespaceUpdate,
} from "@sps/social/models/thread/sdk/model";

export type IProps = {};

export type IResult = {};

const crud = factory<IModel>({
  route,
  host: serverHost,
  options,
  params: query,
});

export const api = {
  ...crud,
  updateMetadataNamespace: async (
    props: Omit<Parameters<typeof crud.update>[0], "data"> &
      IThreadMetadataNamespaceUpdate,
  ): Promise<IModel | null> => {
    const { namespace, expectedValue, value, ...request } = props;
    return (
      (await crud.update({
        ...request,
        data: {
          metadataNamespaceUpdate: {
            namespace,
            expectedValue: expectedValue ?? null,
            value,
          },
        } as unknown as Partial<IModel>,
      })) ?? null
    );
  },
};
