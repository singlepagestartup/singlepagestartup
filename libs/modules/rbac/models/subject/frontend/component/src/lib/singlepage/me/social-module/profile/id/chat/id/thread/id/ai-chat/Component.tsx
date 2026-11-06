import { internationalization } from "@sps/shared-configuration";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  if (!props.project)
    return (
      <p role="alert">
        {ru
          ? "Выберите проект, чтобы открыть его рабочее пространство."
          : "Choose a project to open its workspace."}
      </p>
    );
  return (
    <ClientComponent
      language={props.language}
      key={`${props.project.profile.id}:${props.socialModuleThreadId || props.project.thread.id}`}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      projects={props.projects}
      project={props.project}
      socialModuleThreadId={props.socialModuleThreadId}
      navigation={props.navigation}
      loading={props.loading}
      renderLoadError={props.renderLoadError}
      threads={props.threads}
      threadsLoading={props.threadsLoading}
      threadsError={props.threadsError}
      retryThreads={props.retryThreads}
    />
  );
}
