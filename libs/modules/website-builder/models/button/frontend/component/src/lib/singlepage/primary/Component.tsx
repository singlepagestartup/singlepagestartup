import { IComponentPropsExtended } from "./interface";
import { AnalyticsLink } from "@sps/shared-frontend-components/singlepage/analytics-link";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const withProtocol = props.data.url?.includes(":");
  const href = saveLanguageContext(
    props.data.url || "",
    props.language,
    internationalization.languages,
  );

  return (
    <Button
      data-module="website-builder"
      data-model="button"
      data-id={props.data?.id || ""}
      data-variant={props.data.variant}
      className={cn("w-full", props.data.className, props.className)}
      variant="primary"
      asChild={true}
    >
      <AnalyticsLink
        href={href}
        target={withProtocol ? "_blank" : undefined}
        analytics={[
          {
            name: "website_builder_button_click",
            metadata: {
              id: props.data.id,
              module: "website-builder",
              model: "button",
              variant: props.data.variant,
            },
          },
          {
            name: `website_builder_button_click_${props.data.id}`,
            metadata: {
              id: props.data.id,
              module: "website-builder",
              model: "button",
              variant: props.data.variant,
            },
          },
        ]}
      >
        {props.data.title?.[props.language]}
      </AnalyticsLink>
    </Button>
  );
}
