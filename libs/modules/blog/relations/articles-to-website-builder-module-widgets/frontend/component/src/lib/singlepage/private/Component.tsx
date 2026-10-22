import type { IComponentPropsExtended } from "./interface";
/** Private association content is rendered only by the higher scoped operation. */
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-relation="articles-to-website-builder-module-widgets"
      data-variant="private"
      data-access="locked"
      className={props.className}
    />
  );
}
