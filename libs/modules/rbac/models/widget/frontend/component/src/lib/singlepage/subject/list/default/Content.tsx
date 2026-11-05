import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
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
                  key={subject.id}
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
                          key={entity.id}
                          isServer={props.isServer}
                          variant="default"
                          data={subject}
                          language={props.language}
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
