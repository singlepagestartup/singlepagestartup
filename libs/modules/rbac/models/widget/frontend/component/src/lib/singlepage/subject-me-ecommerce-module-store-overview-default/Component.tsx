import { StoreFrame } from "../subject/me/ecommerce-module/store/StoreFrame";
import { StoreManagement } from "./StoreManagement";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || "en";

  return (
    <StoreFrame
      isServer={props.isServer}
      language={language}
      variant={props.variant}
      widgetId={props.data.id}
      ecommerceModuleStoreSlug={props.ecommerceModuleStoreSlug}
    >
      {(ecommerceModuleStore) => (
        <StoreManagement
          widgetId={props.data.id}
          ecommerceModuleStore={ecommerceModuleStore}
          language={language}
        />
      )}
    </StoreFrame>
  );
}
