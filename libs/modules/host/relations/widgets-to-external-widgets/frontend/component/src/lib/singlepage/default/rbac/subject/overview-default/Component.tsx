import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as HostPage } from "@sps/host/models/page/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";

export function Component(
  props: ISpsComponentBase & {
    url: string;
  },
) {
  return (
    <HostPage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="rbac.subjects.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return null;
        }

        return (
          <RbacSubject
            isServer={props.isServer}
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
