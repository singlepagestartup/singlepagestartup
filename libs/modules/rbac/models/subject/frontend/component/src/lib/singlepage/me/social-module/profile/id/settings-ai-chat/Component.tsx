import { internationalization } from "@sps/shared-configuration";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  if (!props.project)
    return (
      <p role="alert" className="p-8">
        {ru ? "Выберите проект." : "Choose a project."}
      </p>
    );
  return (
    <ClientComponent
      language={props.language}
      key={props.project.profile.id}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      projects={props.projects}
      project={props.project}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}
