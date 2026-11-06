import type { IBylineSkeletonProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
export function Skeleton(props: IBylineSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-module="social"
      data-model="profile"
      data-variant="byline-loading"
      className={cn(
        "flex min-w-0 animate-pulse items-center gap-2 motion-reduce:animate-none",
        props.className,
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-full",
          props.size === "xs" ? "size-6" : "size-11",
          props.inverse ? "bg-default-foreground/20" : "bg-muted",
        )}
      />
      <div className="space-y-2">
        <div
          className={cn(
            "h-3 w-24 rounded",
            props.inverse ? "bg-default-foreground/20" : "bg-muted",
          )}
        />
        {props.size !== "xs" ? (
          <div
            className={cn(
              "h-2 w-16 rounded",
              props.inverse ? "bg-default-foreground/20" : "bg-muted",
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
