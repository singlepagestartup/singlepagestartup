import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      blogModuleArticle={props.blogModuleArticle}
      language={props.language}
      queryScopePrefix={props.queryScopePrefix}
      content={props.content}
      state={props.state}
      onRetry={props.onRetry}
    />
  );
}
