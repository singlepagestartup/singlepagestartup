import type { ReactNode } from "react";
import { Component as PresentationLink } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";

interface IFunnelFrameProps {
  isServer: boolean;
  language: string;
  variant: string;
  widgetId: string;
  children: ReactNode;
}

export function FunnelFrame({
  isServer,
  language,
  variant,
  widgetId,
  children,
}: IFunnelFrameProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={widgetId}
      data-variant={variant}
      className="w-full min-w-0"
    >
      <PresentationLink
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: widgetId }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length === 1 ? (
            <PresentationLink
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={language}
            >
              {children}
            </PresentationLink>
          ) : (
            <p role="alert">
              {language === "ru"
                ? "Страница воронок недоступна."
                : "The funnel page is unavailable."}
            </p>
          )
        }
      </PresentationLink>
    </div>
  );
}
