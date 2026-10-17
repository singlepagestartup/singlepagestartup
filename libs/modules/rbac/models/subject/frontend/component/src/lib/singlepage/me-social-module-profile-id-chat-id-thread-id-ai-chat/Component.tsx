import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  if (!props.project)
    return <p role="alert">Choose a project to open its workspace.</p>;
  return (
    <ClientComponent
      key={`${props.project.profile.id}:${props.threadId || props.project.thread.id}`}
      isServer={props.isServer}
      variant={props.variant}
      data={props.data}
      className={props.className}
      children={props.children}
      projects={props.projects}
      project={props.project}
      threadId={props.threadId}
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
