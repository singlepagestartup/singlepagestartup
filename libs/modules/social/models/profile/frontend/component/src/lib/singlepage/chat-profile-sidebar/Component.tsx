import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={props.isServer}
      className={props.className}
      data={props.data}
      language={props.language}
      skills={props.skills}
      knowledgeDocuments={props.knowledgeDocuments}
      selectedKnowledgeDocument={props.selectedKnowledgeDocument}
      isSkillsLoading={props.isSkillsLoading}
      isKnowledgeDocumentsLoading={props.isKnowledgeDocumentsLoading}
      hasKnowledgeDocumentsError={props.hasKnowledgeDocumentsError}
      onKnowledgeDocumentCreate={props.onKnowledgeDocumentCreate}
      onKnowledgeDocumentSelect={props.onKnowledgeDocumentSelect}
      onMcpServersEdit={props.onMcpServersEdit}
      onProfileEdit={props.onProfileEdit}
      onSkillCreate={props.onSkillCreate}
      onSkillEdit={props.onSkillEdit}
      onClose={props.onClose}
    />
  );
}
