import type { IComponentPropsExtended } from "./interface";
import { Presentation } from "../article-find-grid/Component";
export function Component(props: IComponentPropsExtended) {
  return (
    <Presentation
      data={props.data}
      language={props.language}
      isServer={props.isServer}
      className={props.className}
      variant="article-find-guides"
      layout="guide"
    />
  );
}
