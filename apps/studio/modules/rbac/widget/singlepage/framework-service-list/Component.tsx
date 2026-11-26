import {
  Component as WebsiteBuilderModuleWidget,
  ServiceCard,
} from "../../../../website-builder/widget";
import type { IComponentProps } from "./interface";

export function Component({
  language = "ru",
  services = [],
  resolveLink,
}: IComponentProps = {}) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="framework-service-list"
    >
      <WebsiteBuilderModuleWidget
        variant="content-service-list"
        language={language}
      >
        {services.length
          ? services.map((service) => {
              const href = `/framework/services/${service.slug}`;
              const destination = resolveLink?.(href) ?? href;
              return (
                <ServiceCard
                  key={service.slug}
                  title={service.title[language]}
                  summary={service.summary[language]}
                  href={
                    typeof destination === "string"
                      ? destination
                      : destination.href
                  }
                  target={
                    typeof destination === "string"
                      ? undefined
                      : destination.target
                  }
                  language={language}
                  price={
                    <span className="font-semibold tabular-nums">
                      {service.price}
                    </span>
                  }
                />
              );
            })
          : undefined}
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
