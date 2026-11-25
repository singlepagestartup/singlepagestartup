import { StoreFrame } from "../../StoreFrame";
import { ClientComponent } from "./ClientComponent";
import { directories, type IComponentPropsExtended } from "./interface";

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
        <ClientComponent
          kind={directories[props.variant]}
          widgetId={props.data.id}
          ecommerceModuleStore={ecommerceModuleStore}
          language={language}
        />
      )}
    </StoreFrame>
  );
}
