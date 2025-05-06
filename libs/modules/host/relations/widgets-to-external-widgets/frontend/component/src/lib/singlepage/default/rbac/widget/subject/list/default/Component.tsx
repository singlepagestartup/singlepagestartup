import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <RbacModuleSubject isServer={props.isServer} variant="find">
      {({ data }) => {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data?.map((subject, index) => {
              return (
                /**
                 * Anonumus subjects does not have identities
                 */
                <RbacModuleSubjectsToIdentities
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
                        <RbacModuleSubject
                          key={index}
                          isServer={props.isServer}
                          variant="default"
                          data={subject}
                        />
                      );
                    });
                  }}
                </RbacModuleSubjectsToIdentities>
              );
            })}
          </div>
        );
      }}
    </RbacModuleSubject>
  );
}
