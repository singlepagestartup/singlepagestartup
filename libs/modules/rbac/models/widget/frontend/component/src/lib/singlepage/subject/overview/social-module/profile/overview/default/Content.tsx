import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const slug = props.subjectSlug;
  if (!slug) {
    return <></>;
  }
  return (
    <RbacModuleSubject
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: slug,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((subject, index) => {
          return (
            <RbacModuleSubject
              key={subject.id}
              isServer={props.isServer}
              variant="social-module-profile-list-overview-default"
              data={subject}
              language={props.language}
            />
          );
        });
      }}
    </RbacModuleSubject>
  );
}
