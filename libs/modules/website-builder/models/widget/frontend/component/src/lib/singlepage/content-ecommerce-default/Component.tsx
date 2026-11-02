import { internationalization } from "@sps/shared-configuration";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const title = props.data.title?.[language];
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-6 px-6 py-8 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      {title ||
      props.data.subtitle?.[language] ||
      props.data.description?.[language] ? (
        <header className="min-w-0 space-y-3">
          {title ? (
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
          ) : null}
          {props.data.subtitle?.[language] ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {props.data.subtitle[language]}
            </p>
          ) : null}
          {props.data.description?.[language] ? (
            <div className="text-base leading-7 text-muted-foreground">
              <TipTap value={props.data.description[language] || ""} />
            </div>
          ) : null}
        </header>
      ) : null}
      <div className="min-w-0 w-full">{props.children}</div>
    </section>
  );
}
