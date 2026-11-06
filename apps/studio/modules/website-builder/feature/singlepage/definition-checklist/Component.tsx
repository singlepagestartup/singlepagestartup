import type { IComponentProps } from "./interface";
import { Component as BaseComponent } from "../definition-card";

export function Component(props: IComponentProps) {
  return (
    <div
      className="contents"
      data-module="website-builder"
      data-model="feature"
      data-variant="definition-checklist"
      data-ds-block="website-builder.feature.definition-checklist"
    >
      <BaseComponent
        title={props.title}
        subtitle={props.subtitle}
        description={props.description}
        href={props.href}
        target={props.target}
        linkLabel={props.linkLabel}
        sourceHref={props.sourceHref}
        sourceLabel={props.sourceLabel}
        appearance="checklist"
        actions={props.actions}
      />
    </div>
  );
}
