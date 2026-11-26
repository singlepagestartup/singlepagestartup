import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { SiteShell } from "../framework/Site";
import { resolveFrameworkLink } from "../framework/navigation";
import { services } from "../../../../rbac/widget/singlepage/framework-service-list/fixtures";
import type { IComponentProps } from "./interface";

export function Component({ language = "ru" }: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-service-list"
    >
      <SiteShell active="services" lang={language}>
        <main>
          <RbacModuleWidget
            variant="framework-service-list"
            language={language}
            services={services}
            resolveLink={resolveFrameworkLink}
          />
        </main>
      </SiteShell>
    </div>
  );
}
