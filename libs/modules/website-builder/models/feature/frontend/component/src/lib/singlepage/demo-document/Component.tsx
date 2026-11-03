import {
  cn,
  getRichTextPlainText,
  getRichTextMarkdown,
} from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, language } = props;
  const title = data.title?.[language] || data.title?.en || "";
  const subtitle = getRichTextPlainText(
    data.subtitle?.[language] || data.subtitle?.en,
  );
  const description = getRichTextMarkdown(
    data.description?.[language] || data.description?.en,
  );
  return (
    <article
      data-module="website-builder"
      data-model="feature"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "min-w-0 rounded-xl border border-border p-4",
        data.className,
        props.className,
      )}
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <pre className="mt-4 whitespace-pre-wrap break-words text-sm">
        {description}
      </pre>
    </article>
  );
}
