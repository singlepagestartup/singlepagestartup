import { memo } from "react";
import type { IComponentProps } from "./interface";
export const Component = memo<IComponentProps>(function Component({
  src,
  alt,
  width,
  height,
  label,
}) {
  return (
    <figure
      data-module="website-builder"
      data-model="feature"
      data-variant="preview-scroll"
      data-ds-block="website-builder.feature.preview-scroll"
      className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.5rem] border-[6px] border-default bg-card text-foreground shadow-2xl"
    >
      <div
        aria-hidden="true"
        className="relative flex h-11 items-center justify-between bg-card px-4 text-[11px] font-semibold"
      >
        <span>9:41</span>
        <span className="absolute left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-default" />
        <span className="h-2 w-5 rounded-sm border border-default bg-default/70" />
      </div>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        data-example-scroll
        className="h-[540px] overflow-y-auto bg-muted [scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary @3xl:h-[600px]"
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
      <div
        aria-hidden="true"
        className="flex h-6 items-center justify-center bg-card"
      >
        <span className="h-1 w-20 rounded-full bg-default" />
      </div>
    </figure>
  );
});
