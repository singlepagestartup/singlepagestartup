import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const name = props.name || "SPS editorial team";
  return (
    <section
      data-module="social"
      data-model="profile"
      data-variant="author-overview-default"
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
          <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
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
    </section>
  );
}
