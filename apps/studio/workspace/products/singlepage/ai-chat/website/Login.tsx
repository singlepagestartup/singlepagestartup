import { AIChatPreview } from "./Preview";
const pageContent = {
  sections: {
    hero: {
      title: "Ваши файлы и переписки сохранены.",
      paragraphs: [
        "Войдите, чтобы вернуться к последнему проекту или прерванной задаче. Переписка документа хранит обсуждение и черновик; темы проекта сохраняют прикреплённые документы.",
      ],
      items: [],
      links: [],
    },
    account: {
      title: "Войти",
      paragraphs: [],
      items: [],
      links: [],
    },
    recovery: {
      title: "Не получается войти?",
      paragraphs: [
        "Забыли пароль? [Обратитесь в поддержку](/ai-chat/help). При ошибке входа проверьте данные и повторите попытку.",
        "Ещё нет аккаунта? [Создайте его](/rbac/subject/authentication/email-and-password/registration).",
      ],
      items: [],
      links: [
        {
          text: "Обратитесь в поддержку",
          href: "/ai-chat/help",
        },
        {
          text: "Создайте его",
          href: "/rbac/subject/authentication/email-and-password/registration",
        },
      ],
    },
    success: {
      title: "Вернуться к проекту",
      paragraphs: [
        "Откройте рабочее пространство, чтобы вернуться к документам и перепискам.",
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
          title: "submit",
          text: "Войти",
        },
        {
          title: "forgot-label",
          text: "Забыли пароль?",
        },
        {
          title: "forgot-href",
          text: "/help",
        },
        {
          title: "register-label",
          text: "Создать аккаунт",
        },
        {
          title: "register-href",
          text: "/rbac/subject/authentication/email-and-password/registration",
        },
        {
          title: "no-account",
          text: "Ещё нет аккаунта?",
        },
        {
          title: "continue-label",
          text: "Открыть рабочее пространство",
        },
        {
          title: "continue-href",
          text: "/ai-chat/social/profiles/example",
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
          title: "success-message",
          text: "Вы снова с нами.",
        },
        {
          title: "photo-src",
          text: "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
        },
        {
          title: "photo-asset-id",
          text: "singlepage-generated-living-focus-photography-work-in-motion-square",
        },
        {
          title: "photo-alt",
          text: "Улыбающийся мастер в керамической студии.",
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
    submit: "Войти",
    "forgot-label": "Забыли пароль?",
    "forgot-href": "/help",
    "register-label": "Создать аккаунт",
    "register-href":
      "/rbac/subject/authentication/email-and-password/registration",
    "no-account": "Ещё нет аккаунта?",
    "continue-label": "Открыть рабочее пространство",
    "continue-href": "/ai-chat/social/profiles/example",
    "email-error": "Введите корректный адрес электронной почты.",
    "password-error": "Введите пароль.",
    "success-message": "Вы снова с нами.",
    "photo-src":
      "/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
    "photo-asset-id":
      "singlepage-generated-living-focus-photography-work-in-motion-square",
    "photo-alt": "Улыбающийся мастер в керамической студии.",
  },
};

export default function Login({ text }: { text?: string } = {}) {
  return (
    <AIChatPreview
      initialHref="/rbac/subject/authentication/email-and-password"
      loginCopy={pageContent}
    />
  );
}
