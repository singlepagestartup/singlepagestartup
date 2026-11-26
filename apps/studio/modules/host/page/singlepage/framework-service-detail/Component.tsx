import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { SiteShell } from "../framework/Site";
import { resolveFrameworkLink } from "../framework/navigation";
import { services } from "../../../../rbac/widget/singlepage/framework-service-list/fixtures";
import type { IComponentProps } from "./interface";

export function Component({
  language = "ru",
  productSlug = "framework-business-brief",
}: IComponentProps = {}) {
  const href = resolveFrameworkLink("/framework/services");
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-service-detail"
    >
      <SiteShell active="services" lang={language}>
        <main>
          <RbacModuleWidget
            variant="framework-service-detail"
            language={language}
            service={services.find((entry) => entry.slug === productSlug)}
            backHref={typeof href === "string" ? href : href.href}
            backTarget={typeof href === "string" ? undefined : href.target}
            booking={
              <a
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                target="_top"
                href={`/${language}/framework/services/${encodeURIComponent(productSlug)}#booking`}
              >
                {language === "ru"
                  ? "Открыть оформление заказа"
                  : "Open booking"}
              </a>
            }
          />
        </main>
      </SiteShell>
    </div>
  );
}
