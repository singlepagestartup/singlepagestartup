import { ComponentType, ReactNode, createElement } from "react";

import {
  ExternalWidgetAdapter,
  ExternalWidgetAdapterEntity,
  ExternalWidgetAdapterLoadInput,
} from "../../types";

interface CreateModuleAdapterParams<
  TEntity extends ExternalWidgetAdapterEntity = ExternalWidgetAdapterEntity,
> {
  module: string;
  loadEntityServer: (
    input: ExternalWidgetAdapterLoadInput,
  ) => Promise<TEntity | undefined>;
  loadRenderer: () => Promise<ComponentType<any>>;
  supportsVariant?: (variant: string | undefined | null) => boolean;
}

function pickComponent(moduleRecord: Record<string, unknown>) {
  const maybeComponent = moduleRecord.Component || moduleRecord.default;

  return maybeComponent as ComponentType<any>;
}

export async function renderModuleComponent(
  loader: () => Promise<Record<string, unknown>>,
  props: Record<string, unknown>,
) {
  const Component = pickComponent(await loader());

  return createElement(Component, props) as ReactNode;
}

export function componentFromModule(
  loader: () => Promise<Record<string, unknown>>,
) {
  return async () => {
    return pickComponent(await loader());
  };
}

export function createModuleAdapter<
  TEntity extends ExternalWidgetAdapterEntity = ExternalWidgetAdapterEntity,
>({
  loadEntityServer,
  loadRenderer,
  module,
  supportsVariant = (variant) => Boolean(variant),
}: CreateModuleAdapterParams<TEntity>): ExternalWidgetAdapter<TEntity> {
  return {
    module,
    loadEntityServer,
    supportsVariant,
    async renderServer({ context, relation }) {
      const Component = await loadRenderer();

      return createElement(Component, {
        isServer: true,
        data: relation,
        language: context.language,
        url: context.url,
        variant: relation.variant as any,
      }) as ReactNode;
    },
  };
}
