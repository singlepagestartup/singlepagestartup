import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <RbacSubject isServer={props.isServer} variant="find">
      {({ data }) => {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data?.map((subject, index) => {
              return (
                /**
                 * Anonumus subjects does not have identities
                 */
                <RbacSubjectsToIdentities
                  key={index}
                  isServer={props.isServer}
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
