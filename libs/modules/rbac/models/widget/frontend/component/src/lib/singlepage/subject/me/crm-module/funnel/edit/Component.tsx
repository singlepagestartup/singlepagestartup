import { FunnelFrame } from "../FunnelFrame";
import { ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || "en";

  return (
    <FunnelFrame
      isServer={props.isServer}
      language={language}
      variant={props.variant}
      widgetId={props.data.id}
    >
      <ClientComponent
        widgetId={props.data.id}
        ecommerceModuleStoreSlug={props.ecommerceModuleStoreSlug}
        crmModuleFunnelSlug={props.crmModuleFunnelSlug}
        language={language}
      />
    </FunnelFrame>
  );
}
