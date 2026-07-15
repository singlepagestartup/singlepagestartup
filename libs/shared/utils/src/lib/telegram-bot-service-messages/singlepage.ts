import {
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME,
} from "../envs";

const telegramRequiredChannelName =
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME || "наш Telegram-канал";
const telegramRequiredChannelLink =
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK ||
  (TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME
    ? `https://t.me/${TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME}`
    : "https://t.me");

export const util = {
  openRouterStarted: {
    ru: "💭 Начинаю обрабатывать ваш запрос. Пожалуйста, подождите.",
    en: "Starting to process your request. Please wait.",
  },
  openRouterFetchingModels: {
    ru: "🤖 Подготавливаю роутинг запроса. Пожалуйста, подождите.",
    en: "Preparing request routing. Please wait.",
  },
  openRouterDetectingLanguage: {
    ru: "👅 Классифицирую запрос и модальность. Пожалуйста, подождите.",
    en: "Classifying request and modality. Please wait.",
  },
  openRouterSelectingModels: {
    ru: "👨🏻‍⚕️ Выбираю модель для ответа. Пожалуйста, подождите.",
    en: "Selecting model for response. Please wait.",
  },
  openRouterGeneratingResponse: {
    ru: "🏥 Генерирую ответ с помощью [selectModelForRequest]. Пожалуйста, подождите.",
    en: "Generating response using [selectModelForRequest]. Please wait.",
  },
  openRouterError: {
    ru: "Не удалось обработать запрос. Попробуйте повторить его. Если ошибка повторится, выберите другую модель.",
    en: "The request could not be processed. Please try again. If the error persists, select another model.",
  },
  openRouterRequiredTelegamChannelSubscriptionError: {
    ru: `🧾 Перед началом приёма\n\nЧтобы пользоваться ботом, тебе нужно быть пациентом *Doctor GPT*.\n\nПодпишись на канал [*${telegramRequiredChannelName}*](${telegramRequiredChannelLink})`,
    en: `You need to subscribe to our Telegram channel  - [${telegramRequiredChannelName}](${telegramRequiredChannelLink}) to use this feature.`,
  },
  ecommerceModuleSelectSubscriptionProductsOffer: {
    ru: "💊 Пожалуйста, выберите одну из наших подписок, чтобы продолжить.",
    en: "Please select one of our subscription products to continue.",
  },
  openRouterNotFoundSubscription: {
    ru: "✨ У вас нет активной подписки. Пожалуйста, оформите подписку, чтобы использовать эту функцию.",
    en: "You do not have an active subscription. Please subscribe to use this feature.",
  },
  openRouterNotEnoughTokens: {
    ru: "⛔ У вас закончились токены для данного функционала. Дождитесь возобновления счетчика, выберите другую подписку или пополните баланс токенов",
    en: "У вас закончились токены для данного функционала. Дождитесь возобновления счетчика, выберите другую подписку или пополните баланс токенов",
  },
  openRouterContextResetByNew: {
    ru: "🧹 Контекст очищен. Следующий ответ будет строиться только от новых сообщений после /new.",
    en: "Context has been reset. The next response will use only messages sent after /new.",
  },
  ecommerceModuleOrderPayButtonDescription: {
    ru: "Для оплаты подписки нажмите на кнопку с выбором способа оплаты",
    en: "You can subscribe by the clicking buttons below",
  },
  ecommerceModuleOrderAlreadyHaveSubscription: {
    ru: "У вас уже есть активная подписка.",
    en: "You have active subscription.",
  },
};
