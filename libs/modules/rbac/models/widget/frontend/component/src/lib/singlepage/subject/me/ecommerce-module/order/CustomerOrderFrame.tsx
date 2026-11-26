import type { ReactNode } from "react";
import {
  Default as WidgetsToWebsiteBuilderModuleWidgetsDefault,
  Find as WidgetsToWebsiteBuilderModuleWidgetsFind,
} from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component/src/lib/presentation";

interface IFrameProps {
  isServer: boolean;
  language: string;
  widgetId: string;
  variant: string;
  children: ReactNode;
}
export function CustomerOrderFrame({
  isServer,
  language,
  widgetId,
  variant,
  children,
}: IFrameProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={widgetId}
      data-variant={variant}
      className="w-full min-w-0"
    >
      <WidgetsToWebsiteBuilderModuleWidgetsFind
        variant="find"
        isServer={isServer}
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
            <WidgetsToWebsiteBuilderModuleWidgetsDefault
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={language}
            >
              {children}
            </WidgetsToWebsiteBuilderModuleWidgetsDefault>
          ) : (
            <p role="alert">
              {language === "ru"
                ? "Не удалось открыть страницу заказов."
                : "The orders page is unavailable."}
            </p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgetsFind>
    </div>
  );
}
