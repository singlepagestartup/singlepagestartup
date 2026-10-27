import { internationalization } from "@sps/shared-configuration";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  if (props.projectsError) {
    if (!props.isServer && props.renderError && props.retryProjects)
      return props.renderError({ retry: props.retryProjects });
    return (
      <ClientComponent
        language={props.language}
        error={props.projectsError}
        onRetry={props.retryProjects}
      />
    );
  }
  if (props.projectsLoading)
    return (
      props.loading ?? (
        <div
          role="status"
          aria-label={ru ? "Загрузка проектов" : "Loading projects"}
          className="min-h-11 rounded-xl bg-muted motion-safe:animate-pulse"
        >
          <span className="sr-only">
            {ru ? "Загрузка проектов…" : "Loading projects…"}
          </span>
        </div>
      )
    );
  return props.renderProjects({ projects: props.loadedProjects || [] });
}
