import type { IComponentProps } from "./interface";
import { Component as DefinitionGrid } from "../content-definition-grid";
export function Component(props: IComponentProps) {
  return (
    <div
      className="contents"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-definition-grid-page"
      data-ds-block="website-builder.widget.content-definition-grid-page"
    >
      <DefinitionGrid
        id={props.id}
        className={props.className}
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description}
        headingLevel="h1"
        items={props.items}
        children={props.children}
        appearance={props.appearance}
        columns={props.columns ?? 3}
        actions={props.actions}
        footer={props.footer}
      />
    </div>
  );
}
