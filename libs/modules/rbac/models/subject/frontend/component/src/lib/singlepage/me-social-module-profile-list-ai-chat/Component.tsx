import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  if (props.projectsError) {
    if (!props.isServer && props.renderError && props.retryProjects)
      return props.renderError({ retry: props.retryProjects });
    return (
      <ClientComponent
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
          aria-label="Loading projects"
          className="min-h-11 rounded-xl bg-muted motion-safe:animate-pulse"
        >
          <span className="sr-only">Loading projects…</span>
        </div>
      )
    );
  return props.renderProjects({ projects: props.loadedProjects || [] });
}
