import { AnalyticsLink } from "@sps/shared-frontend-components/singlepage/analytics-link";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Icon } from "@sps/ui-adapter";
import type { IActionViewProps } from "./interface";

export function Component(props: IActionViewProps) {
  const repository =
    props.variant === "repository" || props.variant === "repository-link";
  const quiet = props.variant === "repository-link";
  const text = props.variant === "text-action";
  const navigation =
    props.variant === "navigation" ||
    props.variant === "navigation-inverse" ||
    props.variant === "footer-link";
  const external = Boolean(props.data.url?.includes(":"));
  return (
    <AnalyticsLink
      href={saveLanguageContext(
        props.data.url || "",
        props.language,
        internationalization.languages,
      )}
      aria-current={props.current ? "page" : undefined}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      data-module="website-builder"
      data-model="button"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "inline-flex min-h-11 w-fit max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
        props.variant === "action" &&
          "bg-primary text-primary-foreground hover:brightness-95",
        props.variant === "action-inverse" &&
          "bg-default text-default-foreground hover:brightness-125",
        props.variant === "repository" &&
          "border border-border bg-card text-foreground hover:bg-muted",
        text &&
          "rounded-md px-0 font-medium text-foreground hover:underline hover:underline-offset-4",
        quiet &&
          "rounded-md px-0 font-normal text-default-muted-foreground underline underline-offset-4 hover:text-default-foreground focus-visible:outline-primary",
        props.variant === "navigation" &&
          "w-full justify-start bg-transparent px-3 font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:w-auto lg:justify-center",
        props.variant === "navigation-inverse" &&
          "w-full justify-start bg-transparent px-3 font-medium text-default-foreground/80 hover:bg-card/10",
        props.variant === "footer-link" &&
          "rounded-md bg-transparent px-0 font-normal text-muted-foreground hover:text-foreground hover:underline",
        props.variant === "action-outline-inverse" &&
          "border border-default-foreground/20 text-default-foreground hover:bg-card/10",
        props.current && "bg-muted text-foreground",
        props.data.className,
        props.className,
      )}
      analytics={[
        {
          name: "website_builder_button_click",
          metadata: {
            id: props.data.id,
            module: "website-builder",
            model: "button",
            variant: props.variant,
          },
        },
        {
          name: `website_builder_button_click_${props.data.id}`,
          metadata: {
            id: props.data.id,
            module: "website-builder",
            model: "button",
            variant: props.variant,
          },
        },
      ]}
    >
      {repository && <Icon name="github-logo" size={20} />}
      {props.data.title?.[props.language] || props.data.title?.en}
      {!quiet && !navigation && props.variant !== "action-outline-inverse" && (
        <Icon name={repository ? "arrow-up-right" : "arrow-right"} size={20} />
      )}
      {external && (
        <span className="sr-only">
          (
          {props.language === "ru"
            ? "Откроется в новой вкладке"
            : "Opens in a new tab"}
          )
        </span>
      )}
    </AnalyticsLink>
  );
}
