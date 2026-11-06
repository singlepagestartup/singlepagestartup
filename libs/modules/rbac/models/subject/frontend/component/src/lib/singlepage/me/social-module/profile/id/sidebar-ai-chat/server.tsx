"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import { SourceFiles } from "./ClientComponent";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  const scope = {
    id: props.data.id,
    socialModuleProfileId: props.project.requesterProfileId,
    socialModuleChatId: props.project.chat.id,
    options: props.apiProps?.options,
  };
  try {
    const profiles =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFind(
        scope,
      );
    const profile = profiles.find(
      (item) => item.id === props.socialModuleProfileId,
    );
    const target = {
      ...scope,
      targetSocialModuleProfileId: props.socialModuleProfileId,
    };
    const skillsPromise =
      profile?.variant === "artificial-intelligence"
        ? subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillFind(
            target,
          )
        : Promise.resolve([]);
    const knowledgePromise =
      profile?.variant === "artificial-intelligence"
        ? subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind(
            target,
          )
        : Promise.resolve([]);
    const [skills, knowledge] = await Promise.allSettled([
      skillsPromise,
      knowledgePromise,
    ]);
    const sourceFiles =
      knowledge.status === "fulfilled"
        ? await Promise.all(
            knowledge.value.map(async (source) => {
              try {
                const files =
                  await subjectApi.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind(
                    { ...target, knowledgeModuleSourceId: source.id },
                  );
                return [
                  source.id,
                  <SourceFiles
                    language={props.language}
                    key={source.id}
                    files={files}
                  />,
                ] as const;
              } catch (error) {
                return [
                  source.id,
                  <SourceFiles
                    language={props.language}
                    key={source.id}
                    error={
                      error instanceof Error
                        ? error.message
                        : "Files could not be loaded."
                    }
                  />,
                ] as const;
              }
            }),
          )
        : [];
    return (
      <ChildComponent
        {...props}
        profilesRead={{ data: profiles }}
        skillsRead={
          skills.status === "fulfilled"
            ? { data: skills.value }
            : { error: { message: String(skills.reason) } }
        }
        knowledgeRead={
          knowledge.status === "fulfilled"
            ? { data: knowledge.value }
            : { error: { message: String(knowledge.reason) } }
        }
        sourceFiles={Object.fromEntries(sourceFiles)}
      />
    );
  } catch (error) {
    return (
      <ChildComponent
        {...props}
        profilesRead={{
          error: {
            message:
              error instanceof Error
                ? error.message
                : "Profiles could not be loaded.",
          },
        }}
        skillsRead={{}}
        knowledgeRead={{}}
      />
    );
  }
}
