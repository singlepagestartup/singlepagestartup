import type { IComponentProps } from "./interface";
import { Component as BaseComponent } from "../content-feature-split";

export function Component(props: IComponentProps) {
  return (
    <div
      className="contents"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-feature-split-reverse"
      data-ds-block="website-builder.widget.content-feature-split-reverse"
    >
      <BaseComponent
        id={props.id}
        className={props.className}
        eyebrow={props.eyebrow}
        title={props.title}
        headingLevel={props.headingLevel}
        description={props.description}
        note={props.note}
        media={
          props.media
            ? {
                src: props.media.src,
                alt: props.media.alt,
                priority: props.media.priority,
                fit: "contain",
              }
            : undefined
        }
        mediaPosition="left"
        appearance={props.appearance}
        items={props.items}
        quote={props.quote}
        quoteLabel={props.quoteLabel}
        actions={props.actions}
        children={props.children}
      />
    </div>
  );
}
