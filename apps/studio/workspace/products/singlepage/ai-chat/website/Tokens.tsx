import { Component as RbacModuleSubject } from "./Preview/components/rbac/subject/index";
import { Component as HostModuleLayout } from "./Preview/components/host/layout/index";
import { Component as EcommerceModuleOrder } from "./Preview/components/ecommerce/order/index";

import { AccountProvider } from "./Preview/components/rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

const pageContent = {
  sections: {
    hero: {
      title: "Продолжайте работу над проектом.",
      paragraphs: [
        "Загруженные материалы, сохранённые документы и текущая задача остаются на месте, пока вы выбираете пополнение.",
      ],
      items: [],
      links: [],
    },
    balance: {
      title: "Текущий баланс",
      paragraphs: [
        "Посмотрите доступные бесплатные и купленные токены и задачу, к которой вернётесь после оплаты. Баланс может быть отрицательным.",
      ],
      items: [],
      links: [],
    },
    packages: {
      title: "Выберите пополнение",
      paragraphs: [
        "Во всех пакетах внутренняя единица стоит 0,13 рубля. Скидок на большие пакеты нет.",
      ],
      items: [
        {
          title: "100",
          text: "0.13",
        },
        {
          title: "300",
          text: "0.13",
        },
        {
          title: "500",
          text: "0.13",
        },
        {
          title: "1000",
          text: "0.13",
        },
        {
          title: "3000",
          text: "0.13",
        },
      ],
      links: [],
    },
    purchase: {
      title: "Перед оплатой",
      paragraphs: [
        "Купленные токены не сгорают. После успешной оплаты вернитесь к сохранённой загрузке, документу или задаче в чате.",
      ],
      items: [],
      links: [],
    },
    debt: {
      title: "Когда баланс ограничивает новые запросы",
      paragraphs: [
        "Новые платные AI-запросы ограничены при балансе **−2 000 внутренних токенов или ниже**, что соответствует **−2 долларам расходов провайдера**. Уже запущенный запрос рассчитывается по итоговой стоимости и может опустить баланс ниже порога.",
        "Пополните баланс выше −2 000 токенов, чтобы продолжить сохранённую задачу.",
      ],
      items: [],
      links: [],
    },
    scope: {
      title: "Будущие услуги",
      paragraphs: [
        "Создание лендинга и платное развёртывание на сервере — будущие возможности. Цены и доступность не определены.",
      ],
      items: [],
      links: [],
    },
    charging: {
      title: "Как оплачиваются AI-запросы",
      paragraphs: [
        "Один внутренний токен соответствует 0,001 доллара расходов провайдера. Цена покупки включает наценку 30% при фиксированном пересчёте 100 рублей за доллар. Наценка взимается при пополнении; использование моделей расходует баланс по стоимости провайдера.",
        "При отправке ввода списывается один токен. Успешный ответ рассчитывается по фактической стоимости с округлением вверх до целого внутреннего токена. Минимум — один токен, или 0,13 рубля по цене покупки.",
      ],
      items: [],
      links: [],
    },
    refunds: {
      title: "Неудачные запросы и возвраты",
      paragraphs: [
        "Если AI-запрос завершился ошибкой или отменён, возвращаются все списания по нему, включая начальный токен и итоговый расчёт. Чистое списание равно нулю. Расходы провайдера несёт сервис.",
        "Возврат токенов отличается от денежного возврата пополнения. Обычно покупки окончательны; денежный возврат рассматривается индивидуально и не заявлен как общее право покупателя.",
      ],
      items: [],
      links: [],
    },
    recovery: {
      title: "Если оплата не завершилась",
      paragraphs: [
        "Неудачная или отменённая оплата не меняет сохранённую работу и баланс. Проверьте результат, повторите попытку или обратитесь в поддержку. Можно вернуться в рабочее пространство без покупки.",
      ],
      items: [],
      links: [],
    },
    success: {
      title: "Пакет выбран",
      paragraphs: [
        "Проверьте сумму и количество токенов. Можно выбрать другой пакет или вернуться в рабочее пространство.",
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
          text: "Назад в рабочее пространство",
        },
        {
          title: "back-href",
          text: "/ai-chat/social/profiles/example",
        },
        {
          title: "balance-label",
          text: "Текущий баланс",
        },
        {
          title: "balance-unit",
          text: "токенов осталось",
        },
        {
          title: "package-label",
          text: "Выберите пополнение",
        },
        {
          title: "selected-label",
          text: "Выбранный пакет",
        },
        {
          title: "select-prompt",
          text: "Выберите сумму",
        },
        {
          title: "token-amount-label",
          text: "Примерное число токенов",
        },
        {
          title: "total-label",
          text: "Итого",
        },
        {
          title: "terms-label",
          text: "Условия токенов и оплаты",
        },
        {
          title: "credit-note",
          text: "Расчёт по указанной цене. Итоговое начисление будет показано перед оплатой.",
        },
        {
          title: "free-balance-label",
          text: "Бесплатные токены",
        },
        {
          title: "paid-balance-label",
          text: "Купленные токены",
        },
        {
          title: "balance-source",
          text: "Бесплатные и купленные токены этого аккаунта",
        },
        {
          title: "currency",
          text: "RUB",
        },
        {
          title: "rate-label",
          text: "0,13 рубля за внутренний токен",
        },
        {
          title: "continue-payment",
          text: "Перейти к оплате",
        },
        {
          title: "retry",
          text: "Повторить",
        },
        {
          title: "return-without-buying",
          text: "Вернуться без покупки",
        },
        {
          title: "return-href",
          text: "/ai-chat/social/profiles/example",
        },
        {
          title: "help-label",
          text: "Обратиться за помощью",
        },
        {
          title: "help-href",
          text: "/help",
        },
        {
          title: "success-message",
          text: "Пакет выбран.",
        },
      ],
      links: [],
    },
  },
  labels: {
    "back-label": "Назад в рабочее пространство",
    "back-href": "/ai-chat/social/profiles/example",
    "balance-label": "Текущий баланс",
    "balance-unit": "токенов осталось",
    "package-label": "Выберите пополнение",
    "selected-label": "Выбранный пакет",
    "select-prompt": "Выберите сумму",
    "token-amount-label": "Примерное число токенов",
    "total-label": "Итого",
    "terms-label": "Условия токенов и оплаты",
    "credit-note":
      "Расчёт по указанной цене. Итоговое начисление будет показано перед оплатой.",
    "free-balance-label": "Бесплатные токены",
    "paid-balance-label": "Купленные токены",
    "balance-source": "Бесплатные и купленные токены этого аккаунта",
    currency: "RUB",
    "rate-label": "0,13 рубля за внутренний токен",
    "continue-payment": "Перейти к оплате",
    retry: "Повторить",
    "return-without-buying": "Вернуться без покупки",
    "return-href": "/ai-chat/social/profiles/example",
    "help-label": "Обратиться за помощью",
    "help-href": "/help",
    "success-message": "Пакет выбран.",
  },
};

export default function Tokens({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-dashboard"
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="account"
            showTokens
            page="tokens"
            onNavigate={onNavigate}
          />
        )}
      >
        <EcommerceModuleOrder
          variant="checkout-tokens-ai-chat"
          copy={pageContent}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
