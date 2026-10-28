import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const name = props.name || "SPS editorial team";
  return (
    <a
      href={`/${props.language || "en"}/authors/${props.id || "57dcabf0-889d-4240-8c6a-c27ca851a845"}`}
      data-module="social"
      data-model="profile"
      data-variant="author-byline-default"
      className="inline-flex min-w-0 items-center gap-2 rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
          {props.avatar ? (
            <img src={props.avatar} alt="" className="size-full object-cover" />
          ) : (
            name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0])
              .join("")
          )}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{name}</p>
          {props.subtitle ? (
            <p className="text-sm text-muted-foreground">{props.subtitle}</p>
          ) : null}
        </div>
      </div>
    </a>
  );
}
