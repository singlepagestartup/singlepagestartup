import { Component as HostModuleLayout } from "./Preview/components/host/layout/index";
import { Component as RbacModuleSubject } from "./Preview/components/rbac/subject/index";

import { AccountProvider } from "./Preview/components/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

const pageContent = {
  sections: {
    hero: {
      title: "Перенесите проект в чат.",
      paragraphs: [
        "Создайте аккаунт, чтобы добавить заметки, файлы и изображения. Работайте с AI в переписке каждого документа, затем используйте сохранённые документы в новых обсуждениях проекта.",
      ],
      items: [],
      links: [],
    },
    account: {
      title: "Создать аккаунт",
      paragraphs: [
        "Бесплатный баланс токенов появится в рабочем пространстве.",
      ],
      items: [],
      links: [],
    },
    materials: {
      title: "Перед добавлением файлов",
      paragraphs: [
        "Прочитайте, [как обрабатываются и хранятся материалы](/ai-chat/social/profiles/create#how-your-materials-are-processed-and-stored), включая обработку внешними AI-сервисами и хранение резервных копий после удаления.",
      ],
      items: [],
      links: [
        {
          text: "как обрабатываются и хранятся материалы",
          href: "/ai-chat/social/profiles/create#how-your-materials-are-processed-and-stored",
        },
      ],
    },
    success: {
      title: "Аккаунт готов",
      paragraphs: [
        "Перейдите в чат проекта и добавьте заметки, файлы и изображения.",
      ],
      items: [],
      links: [],
    },
    controls: {
      title: "Подписи интерфейса",
      paragraphs: [],
      items: [
        {
          title: "back-label",
          text: "Назад к AI Chat",
        },
        {
          title: "back-href",
          text: "/ai-chat/",
        },
        {
          title: "email-label",
          text: "Электронная почта",
        },
        {
          title: "email-placeholder",
          text: "you@example.com",
        },
        {
          title: "password-label",
          text: "Пароль",
        },
        {
          title: "repeat-password-label",
          text: "Повторите пароль",
        },
        {
          title: "terms-label",
          text: "Как обрабатываются и хранятся материалы",
        },
        {
          title: "terms-href",
          text: "/ai-chat/social/profiles/create#how-your-materials-are-processed-and-stored",
        },
        {
          title: "submit",
          text: "Создать аккаунт",
        },
        {
          title: "sign-in-label",
          text: "Войти",
        },
        {
          title: "sign-in-href",
          text: "/rbac/subject/authentication/email-and-password",
        },
        {
          title: "existing-account",
          text: "Уже есть аккаунт?",
        },
        {
          title: "continue-label",
          text: "Открыть чат проекта",
        },
        {
          title: "continue-href",
          text: "/ai-chat/social/profiles/create",
        },
        {
          title: "email-error",
          text: "Введите корректный адрес электронной почты.",
        },
        {
          title: "password-error",
          text: "Введите пароль.",
        },
        {
          title: "repeat-password-error",
          text: "Введите одинаковый пароль в оба поля.",
        },
        {
          title: "success-message",
          text: "Аккаунт готов.",
        },
        {
          title: "photo-src",
          text: "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png",
        },
        {
          title: "photo-asset-id",
          text: "singlepage-generated-living-focus-photography-project-start-v1-square",
        },
        {
          title: "photo-alt",
          text: "Женщина работает над проектом с ноутбуком и блокнотом.",
        },
        {
          title: "secondary-photo-src",
          text: "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-progress-v1-square.png",
        },
        {
          title: "secondary-photo-asset-id",
          text: "singlepage-generated-living-focus-photography-project-progress-v1-square",
        },
        {
          title: "secondary-photo-alt",
          text: "Мужчина изучает набросок проекта рядом с ноутбуком.",
        },
      ],
      links: [],
    },
  },
  labels: {
    "back-label": "Назад к AI Chat",
    "back-href": "/ai-chat/",
    "email-label": "Электронная почта",
    "email-placeholder": "you@example.com",
    "password-label": "Пароль",
    "repeat-password-label": "Повторите пароль",
    "terms-label": "Как обрабатываются и хранятся материалы",
    "terms-href":
      "/ai-chat/social/profiles/create#how-your-materials-are-processed-and-stored",
    submit: "Создать аккаунт",
    "sign-in-label": "Войти",
    "sign-in-href": "/rbac/subject/authentication/email-and-password",
    "existing-account": "Уже есть аккаунт?",
    "continue-label": "Открыть чат проекта",
    "continue-href": "/ai-chat/social/profiles/create",
    "email-error": "Введите корректный адрес электронной почты.",
    "password-error": "Введите пароль.",
    "repeat-password-error": "Введите одинаковый пароль в оба поля.",
    "success-message": "Аккаунт готов.",
    "photo-src":
      "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png",
    "photo-asset-id":
      "singlepage-generated-living-focus-photography-project-start-v1-square",
    "photo-alt": "Женщина работает над проектом с ноутбуком и блокнотом.",
    "secondary-photo-src":
      "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-project-progress-v1-square.png",
    "secondary-photo-asset-id":
      "singlepage-generated-living-focus-photography-project-progress-v1-square",
    "secondary-photo-alt":
      "Мужчина изучает набросок проекта рядом с ноутбуком.",
  },
};

export default function Register({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout variant="ai-chat-dashboard" page="register">
        <RbacModuleSubject
          variant="authentication-email-and-password-registration-form-ai-chat"
          copy={pageContent}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
