"use client";
import { internationalization } from "@sps/shared-configuration";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleSkill } from "@sps/social/models/skill/frontend/component";
import { Component as KnowledgeModuleSource } from "@sps/knowledge/models/source/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import type { IComponentPropsExtended, ISourceFilesProps } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const profiles = props.profilesRead;
  const profile = profiles.data?.find(
    (item) => item.id === props.socialModuleProfileId,
  );
  const skills = props.skillsRead;
  const knowledge = props.knowledgeRead;
  if (profiles.isPending)
    return (
      <p role="status" className="p-4">
        {ru ? "Загрузка профиля помощника…" : "Loading assistant profile…"}
      </p>
    );
  if (!profile || profiles.error)
    return (
      <p role="alert" className="p-4 text-destructive">
        {profiles.error?.message ||
          (ru
            ? "Профиль помощника недоступен в этом чате."
            : "Assistant profile is unavailable in this Chat.")}
      </p>
    );
  return (
    <SocialModuleProfile
      isServer={false}
      variant="agent-id-ai-chat"
      data={profile}
      dataSource="props"
      language={language}
      onClose={props.onClose}
      skillsCount={skills.data?.length}
      knowledgeCount={knowledge.data?.length}
      skills={
        skills.isPending ? (
          <p role="status">{ru ? "Загрузка навыков…" : "Loading skills…"}</p>
        ) : skills.error ? (
          <p role="alert">{skills.error.message}</p>
        ) : skills.data?.length ? (
          skills.data.map((skill) => (
            <SocialModuleSkill
              key={skill.id}
              isServer={false}
              variant="id-ai-chat"
              data={skill}
              dataSource="props"
              language={language}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {ru ? "Подключённых навыков нет." : "No linked skills."}
          </p>
        )
      }
    >
      {knowledge.isPending ? (
        <p role="status">{ru ? "Загрузка знаний…" : "Loading knowledge…"}</p>
      ) : knowledge.error ? (
        <p role="alert">{knowledge.error.message}</p>
      ) : knowledge.data?.length ? (
        knowledge.data.map((source) => (
          <KnowledgeModuleSource
            language={props.language}
            key={source.id}
            isServer={false}
            variant="id-sidebar-ai-chat"
            data={source}
            dataSource="props"
          >
            {props.sourceFiles?.[source.id]}
          </KnowledgeModuleSource>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          {ru ? "Подключённых знаний нет." : "No linked knowledge."}
        </p>
      )}
    </SocialModuleProfile>
  );
}
export function SourceFiles({
  files,
  error,
  language = internationalization.defaultLanguage.code,
}: ISourceFilesProps) {
  const ru = language === "ru";
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">
        {ru ? "Файлы" : "Files"} · {files?.length || 0}
      </p>
      {error && <p role="alert">{error}</p>}
      {files?.map(({ file }) => (
        <FileStorageModuleFile
          language={language}
          key={file.id}
          isServer={false}
          variant="attachment-ai-chat"
          data={file}
          dataSource="props"
        />
      ))}
    </div>
  );
}
