import type { IComponentProps } from "./interface";
import { Component as BaseComponent } from "../content-offer";

export function Component(props: IComponentProps) {
  return (
    <div
      className="contents"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-offer-card"
      data-ds-block="website-builder.widget.content-offer-card"
    >
      <BaseComponent
        id={props.id}
        eyebrow={props.eyebrow}
        title={props.title}
        headingLevel={props.headingLevel}
        description={props.description}
        note={props.note}
        appearance="light"
        embedded
        actions={props.actions}
        children={props.children}
      />
    </div>
  );
}
