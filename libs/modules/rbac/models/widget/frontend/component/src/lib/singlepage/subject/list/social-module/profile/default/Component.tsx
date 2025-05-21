import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as SubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";
import Link from "next/link";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col max-w-7xl mx-auto",
        props.data.className,
      )}
    >
      <Card className="w-full flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? (
            <CardTitle>
              {props.data.title?.[internationalization.defaultLanguage.code]}
            </CardTitle>
          ) : null}
          {props.data.description?.[
            internationalization.defaultLanguage.code
          ] ? (
            <TipTap
              value={
                props.data.description?.[
                  internationalization.defaultLanguage.code
                ] || ""
              }
            />
          ) : null}
        </CardHeader>
        <CardContent>
          <Subject isServer={props.isServer} variant="find">
            {({ data: subjects }) => {
              if (!subjects) {
                return null;
              }

              return (
                <SocialModuleProfile isServer={props.isServer} variant="find">
                  {({ data: socialModuleProfiles }) => {
                    return (
                      <SubjectsToSocialModuleProfiles
                        isServer={props.isServer}
                        variant="find"
                      >
                        {({ data: subjectsToSocialModuleProfiles }) => {
                          if (!subjectsToSocialModuleProfiles) {
                            return null;
                          }

                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {socialModuleProfiles
                                ?.filter((socialModuleProfile) =>
                                  subjectsToSocialModuleProfiles?.some(
                                    (subjectToSocialModuleProfile) =>
                                      subjectToSocialModuleProfile.socialModuleProfileId ===
                                      socialModuleProfile.id,
                                  ),
                                )
                                ?.map((entity, index) => {
                                  const subjectToSocialModuleProfile =
                                    subjectsToSocialModuleProfiles.find(
                                      (subjectToSocialModuleProfile) =>
                                        subjectToSocialModuleProfile.socialModuleProfileId ===
                                        entity.id,
                                    );

                                  const subject = subjects.find(
                                    (subject) =>
                                      subject.id ===
                                      subjectToSocialModuleProfile?.subjectId,
                                  );

                                  return (
                                    <Link
                                      key={index}
                                      href={`/rbac/subjects/${subject?.slug}`}
                                    >
                                      <SocialModuleProfile
                                        data={entity}
                                        variant="default"
                                        language={props.language}
                                        isServer={props.isServer}
                                        className="hover:border-black transition-all duration-300"
                                      />
                                    </Link>
                                  );
                                })}
                            </div>
                          );
                        }}
                      </SubjectsToSocialModuleProfiles>
                    );
                  }}
                </SocialModuleProfile>
              );
            }}
          </Subject>
        </CardContent>
      </Card>
    </div>
  );
}
