import { MarkdownDocument } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
export interface IKnowledgeSkill {
  id: string;
  slug: string;
  title: string;
  adminTitle: string;
  description: string;
  variant: string;
}
export const knowledgeSkill: IKnowledgeSkill = {
  id: "knowledge-editing",
  slug: "knowledge-editing",
  title: "Knowledge editing",
  adminTitle: "Knowledge editing",
  variant: "overview-ai-chat",
  description:
    "Work with the knowledge linked to this thread and its files. Ask for missing facts. Keep supplied facts separate from assumptions. Propose changes to the knowledge for the user to apply.",
};
export function Component() {
  return (
    <section
      data-ds-block="social.skill.overview-ai-chat"
      data-module="social"
      data-model="skill"
      data-id={knowledgeSkill.id}
      data-variant={knowledgeSkill.variant}
    >
      <h3 className="mb-3 font-semibold">{knowledgeSkill.title}</h3>
      <MarkdownDocument>{knowledgeSkill.description}</MarkdownDocument>
    </section>
  );
}
