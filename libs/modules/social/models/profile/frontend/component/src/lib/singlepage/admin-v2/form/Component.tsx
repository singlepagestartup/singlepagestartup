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
      profilesToFileStorageModuleFiles={props.profilesToFileStorageModuleFiles}
      profilesToKnowledgeModuleSources={props.profilesToKnowledgeModuleSources}
      profilesToSkills={props.profilesToSkills}
      profilesToWebsiteBuilderModuleWidgets={
        props.profilesToWebsiteBuilderModuleWidgets
      }
      profilesToAttributes={props.profilesToAttributes}
      profilesToChats={props.profilesToChats}
      profilesToMessages={props.profilesToMessages}
      profilesToActions={props.profilesToActions}
      profilesToEcommerceModuleProducts={
        props.profilesToEcommerceModuleProducts
      }
      panelDepth={props.panelDepth}
      isTop={props.isTop}
    />
  );
}
