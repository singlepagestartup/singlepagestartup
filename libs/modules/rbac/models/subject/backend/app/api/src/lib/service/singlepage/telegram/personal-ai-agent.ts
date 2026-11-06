import {
  getTelegramPersonalAiAgentSlug,
  type IModel as IRbacSubject,
} from "@sps/rbac/models/subject/sdk/model";
import { Service as Bootstrap } from "../social-module/profile/ai/bootstrap";
export type {
  IConstructorProps,
  IResult,
} from "../social-module/profile/ai/bootstrap";
export interface IExecuteProps {
  ownerRbacSubject: IRbacSubject;
  socialModuleChatId: string;
}
export class Service extends Bootstrap {
  execute(props: IExecuteProps) {
    return super.execute({
      ...props,
      slug: getTelegramPersonalAiAgentSlug(props.ownerRbacSubject.id),
      title: "My AI agent",
      adminTitle: `Telegram personal AI agent for ${props.ownerRbacSubject.slug}`,
      titleTranslations: { en: "My AI agent", ru: "Мой ИИ-агент" },
      relationVariant: "telegram-personal-ai-agent",
    });
  }
}
