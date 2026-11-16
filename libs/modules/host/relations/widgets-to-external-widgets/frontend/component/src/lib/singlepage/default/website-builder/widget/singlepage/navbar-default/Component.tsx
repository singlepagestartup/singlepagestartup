import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
      url={props.url}
    >
      {({ data: routeParams }) => (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <RbacSubject
            isServer={false}
            language={props.language}
            variant="me-ecommerce-module-cart-default"
          />
          <RbacSubject
            isServer={false}
            language={props.language}
            variant="me-account"
            socialModuleProfileId={routeParams?.["social.profiles.id"]}
          />
        </div>
      )}
    </Page>
  );
}
