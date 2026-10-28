import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const name = props.name || "SPS editorial team";
  return (
    <a
      href={`/${props.language || "en"}/authors/${props.id || "57dcabf0-889d-4240-8c6a-c27ca851a845"}`}
      data-module="social"
      data-model="profile"
      data-variant="author-card-default"
      className="block space-y-4 rounded-2xl border border-border bg-card p-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
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
      <p className="text-sm leading-6 text-muted-foreground">
        {props.description ||
          "Articles and projects built with SinglePageStartup."}
      </p>
      <p className="text-xs text-muted-foreground">
        {props.articleCount ?? 2} articles · {props.productCount ?? 1} projects
      </p>
      {props.children}
    </a>
  );
}
