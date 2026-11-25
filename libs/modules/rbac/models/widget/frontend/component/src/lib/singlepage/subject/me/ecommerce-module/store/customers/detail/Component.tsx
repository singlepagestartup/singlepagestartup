import { StoreFrame } from "../../StoreFrame";
import { ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  if (!props.rbacSubjectId) return null;
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
        <ClientComponent
          widgetId={props.data.id}
          ecommerceModuleStore={ecommerceModuleStore}
          rbacSubjectId={props.rbacSubjectId}
          language={language}
        />
      )}
    </StoreFrame>
  );
}
