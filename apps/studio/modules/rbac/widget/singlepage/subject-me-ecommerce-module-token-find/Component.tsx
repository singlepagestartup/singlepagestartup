import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import type { IComponentProps } from "./interface";

/** Preview of RBAC's curated catalogue and current-Subject purchase ownership. */
export function Component({
  variant = "subject-me-ecommerce-module-token-find",
  pro,
  topups,
  registrationAllowance,
  tokenRate,
  registrationHref,
  chatHref,
  frameworkHref,
  linkTarget,
}: IComponentProps = {}) {
  return (
    <div data-module="rbac" data-model="widget" data-variant={variant}>
      <EcommerceModuleWidget
        variant="token-find"
        pro={pro}
        topups={topups}
        registrationAllowance={registrationAllowance}
        tokenRate={tokenRate}
        registrationHref={registrationHref}
        chatHref={chatHref}
        frameworkHref={frameworkHref}
        linkTarget={linkTarget}
      />
    </div>
  );
}
