import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <SubjectsToSocialModuleProfiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.data?.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((subjectToSocialModuleProfile, index) => {
            return (
              <SubjectsToSocialModuleProfiles
                key={index}
                isServer={props.isServer}
                variant={subjectToSocialModuleProfile.variant as any}
                data={subjectToSocialModuleProfile}
                language={props.language}
              />
            );
          });
        }}
      </SubjectsToSocialModuleProfiles>
    </div>
  );
}
