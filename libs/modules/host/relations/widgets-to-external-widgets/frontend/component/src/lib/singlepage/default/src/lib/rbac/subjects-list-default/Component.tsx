import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <RbacSubject
      isServer={props.isServer}
      hostUrl={props.hostUrl}
      variant="find"
    >
      {({ data }) => {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data?.map((subject, index) => {
              return (
                <RbacSubjectsToIdentities
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "subjectId",
                            method: "eq",
                            value: subject.id,
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data }) => {
                    return data?.map((entity, index) => {
                      return (
                        <RbacSubject
                          key={index}
                          isServer={props.isServer}
                          hostUrl={props.hostUrl}
                          variant="default"
                          data={subject}
                        />
                      );
                    });
                  }}
                </RbacSubjectsToIdentities>
              );
            })}
          </div>
        );
      }}
    </RbacSubject>
  );
}
