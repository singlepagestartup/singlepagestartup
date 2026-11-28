import type { ReactNode } from "react";
import {
  Default as WidgetsToWebsiteBuilderModuleWidgetsDefault,
  Find as WidgetsToWebsiteBuilderModuleWidgetsFind,
} from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component/src/lib/presentation";
import type { IModel as IWidget } from "@sps/rbac/models/widget/sdk/model";
import type { IPresentationSlots } from "@sps/website-builder/models/widget/frontend/component";

interface IServiceFrameProps {
  isServer: boolean;
  language: string;
  widget: IWidget;
  children?: ReactNode;
  slots?: IPresentationSlots;
}

export function ServiceFrame({
  isServer,
  language,
  widget,
  children,
  slots,
}: IServiceFrameProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={widget.id}
      data-variant={widget.variant}
      className="w-full min-w-0"
    >
      <WidgetsToWebsiteBuilderModuleWidgetsFind
        variant="find"
        isServer={isServer}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: widget.id }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length === 1 && (
            <WidgetsToWebsiteBuilderModuleWidgetsDefault
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={language}
              slots={slots}
            >
              {children}
            </WidgetsToWebsiteBuilderModuleWidgetsDefault>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgetsFind>
    </div>
  );
}
