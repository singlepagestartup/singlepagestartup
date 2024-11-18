import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as HostPage } from "@sps/host/models/page/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <HostPage
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="url-segment-value"
      segment="rbac.subjects.id"
    >
      {({ data }) => {
        if (!data) {
          return null;
        }

        return (
          <RbacSubject
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="overview-default"
            data={{
              id: data,
            }}
          />
        );
      }}
    </HostPage>
  );
}
