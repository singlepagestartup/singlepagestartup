import { TipTap } from "@sps/shared-ui-shadcn";
import type { IComponentPropsExtended } from "./interface";
import { Component as PreviewScroll } from "../preview-scroll";
import { Icon } from "@sps/ui-adapter";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  const description = data.description?.[language] || data.description?.en;
  const inputId = `choice-${props.selectionGroupId || data.id}-${data.id}`;
  return (
    <div
      className="contents"
      data-module="website-builder"
      data-model="feature"
      data-id={data.id}
      data-variant="selectable"
    >
      <input
        id={inputId}
        type="radio"
        name={props.selectionGroupId || data.id}
        defaultChecked={props.initiallySelected}
        aria-labelledby={`${inputId}-label`}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className="order-1 block w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-default-foreground/15 text-default-foreground peer-checked:border-primary peer-checked:[&_[data-choice-title]]:bg-primary peer-checked:[&_[data-choice-title]]:text-primary-foreground peer-checked:[&_[data-choice-description]]:block peer-checked:[&_[data-choice-check]]:block peer-checked:[&_[data-choice-plus]]:hidden peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary @3xl:col-start-1"
      >
        <span
          data-choice-title
          className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <span id={`${inputId}-label`}>{title}</span>
          <Icon name="plus" size={20} data-choice-plus />
          <Icon name="check" size={20} data-choice-check className="hidden" />
        </span>
        <span
          data-choice-description
          className="hidden px-4 pb-4 pt-3 text-sm leading-6 text-default-muted-foreground [&_.prose]:text-default-muted-foreground"
        >
          <TipTap value={description ?? ""} />
        </span>
      </label>
      <div className="order-2 hidden min-w-0 pt-5 peer-checked:block @3xl:absolute @3xl:inset-y-0 @3xl:right-0 @3xl:w-1/2 @3xl:items-center @3xl:justify-center @3xl:pt-0 @3xl:pl-5 @3xl:peer-checked:flex">
        <PreviewScroll
          isServer={isServer}
          variant="preview-scroll"
          dataSource="props"
          data={data}
          language={language}
        />
      </div>
    </div>
  );
}
