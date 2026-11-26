import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import type { IComponentProps } from "./interface";

export function Component({
  language = "ru",
  service,
  backHref,
  backTarget,
  booking,
}: IComponentProps = {}) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="framework-service-detail"
    >
      <WebsiteBuilderModuleWidget
        variant="content-service-detail"
        language={language}
        backHref={backHref}
        backTarget={backTarget}
        slots={
          service && {
            heading: service.title[language],
            summary: service.summary[language],
            description: service.description[language],
            price: (
              <span className="font-semibold tabular-nums">
                {service.price}
              </span>
            ),
          }
        }
      >
        {booking}
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
