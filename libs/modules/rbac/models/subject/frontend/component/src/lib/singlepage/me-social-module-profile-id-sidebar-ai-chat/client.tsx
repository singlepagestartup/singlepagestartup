"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import { SourceFiles } from "./ClientComponent";
import type { IComponentProps, ISourceFilesReaderProps } from "./interface";
export default function Client(props: IComponentProps) {
  const scope = {
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleProfileId: props.project.requesterProfileId,
    socialModuleChatId: props.project.chat.id,
  };
  const profiles =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFind(scope);
  const profile = profiles.data?.find((item) => item.id === props.profileId);
  const target = {
    ...scope,
    targetSocialModuleProfileId: props.profileId,
    reactQueryOptions: {
      enabled: !!profile && profile.variant === "artificial-intelligence",
    },
  };
  const skills =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
      target,
    );
  const knowledge =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
      target,
    );
  if (profiles.isPending) return props.skeleton ?? <Skeleton />;
  return (
    <ChildComponent
      {...props}
      profilesRead={{
        data: profiles.data,
        isPending: profiles.isPending,
        error: profiles.error ? { message: profiles.error.message } : undefined,
      }}
      skillsRead={{
        data: skills.data,
        isPending: skills.isPending,
        error: skills.error ? { message: skills.error.message } : undefined,
      }}
      knowledgeRead={{
        data: knowledge.data,
        isPending: knowledge.isPending,
        error: knowledge.error
          ? { message: knowledge.error.message }
          : undefined,
      }}
      sourceFiles={Object.fromEntries(
        (knowledge.data || []).map((source) => [
          source.id,
          <SourceFilesReader
            key={source.id}
            scope={scope}
            profileId={props.profileId}
            sourceId={source.id}
          />,
        ]),
      )}
    />
  );
}
function SourceFilesReader({
  scope,
  profileId,
  sourceId,
}: ISourceFilesReaderProps) {
  const files =
    subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind(
      {
        ...scope,
        targetSocialModuleProfileId: profileId,
        knowledgeModuleSourceId: sourceId,
      },
    );
  return <SourceFiles files={files.data} error={files.error?.message} />;
}
