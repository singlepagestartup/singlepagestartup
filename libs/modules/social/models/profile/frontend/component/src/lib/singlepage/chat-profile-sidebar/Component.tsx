import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      className={props.className}
      data={props.data}
      avatar={props.avatar}
      displayName={props.displayName}
      language={props.language}
      profileCaption={props.profileCaption}
      summaryOnly={props.summaryOnly}
      skills={props.skills}
      knowledgeSources={props.knowledgeSources}
      selectedKnowledgeSource={props.selectedKnowledgeSource}
      isSkillsLoading={props.isSkillsLoading}
      isKnowledgeSourcesLoading={props.isKnowledgeSourcesLoading}
      hasKnowledgeSourcesError={props.hasKnowledgeSourcesError}
      onKnowledgeSourceCreate={props.onKnowledgeSourceCreate}
      onKnowledgeSourceSelect={props.onKnowledgeSourceSelect}
      onMcpServersEdit={props.onMcpServersEdit}
      onProfileEdit={props.onProfileEdit}
      onSkillCreate={props.onSkillCreate}
      onSkillEdit={props.onSkillEdit}
      onClose={props.onClose}
    />
  );
}
