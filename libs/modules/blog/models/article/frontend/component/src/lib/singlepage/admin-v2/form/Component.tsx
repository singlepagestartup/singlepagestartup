import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      skeleton={props.skeleton}
      variant={props.variant}
      data={props.data}
      apiProps={props.apiProps}
      className={props.className}
      profilesToBlogModuleArticles={props.profilesToBlogModuleArticles}
      widgetsToArticles={props.widgetsToArticles}
      articlesToEcommerceModuleProducts={
        props.articlesToEcommerceModuleProducts
      }
      categoriesToArticles={props.categoriesToArticles}
      articlesToFileStorageModuleWidgets={
        props.articlesToFileStorageModuleWidgets
      }
      articlesToWebsiteBuilderModuleWidgets={
        props.articlesToWebsiteBuilderModuleWidgets
      }
      panelDepth={props.panelDepth}
      isTop={props.isTop}
    />
  );
}
