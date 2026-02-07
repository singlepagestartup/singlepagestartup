import { util as singlepageUtil } from "./singlepage";

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
  ...singlepageUtil,
  welcomeMessage: {
    ru: "🩺 *Добро пожаловать*\n\nЭто официальный AI-бот от [Doctor GPT](https://t.me/+czDYKcfjNFszY2Yy).\n\nЗдесь ты - *пациент*,а бот подбирает _лучшее решение_ под твою задачу.\n\nПросто опиши, что тебе нужно: текст, идея, план, картинка, сценарий",
    en: "🩺 *Добро пожаловать*\n\nЭто официальный AI-бот от [Doctor GPT](https://t.me/+czDYKcfjNFszY2Yy).\n\nЗдесь ты - *пациент*,а бот подбирает _лучшее решение_ под твою задачу.\n\nПросто опиши, что тебе нужно: текст, идея, план, картинка, сценарий",
  },
  notFoundInRequiredTelegramChannelSubscribers: {
    ru: `Не нашли тебя среди подписчиков [${telegramRequiredChannelName}](${telegramRequiredChannelLink}). Подпишись и попробуй проверить подписку снова.`,
    en: `Не нашли тебя среди подписчиков [${telegramRequiredChannelName}](${telegramRequiredChannelLink}). Подпишись и попробуй проверить подписку снова.`,
  },
  acceptedRequiredTelegramChannelSubscribers: {
    ru: "✅ Готово\n\nТы зарегистрирован как пациент Doctor GPT.\n\nМожем начинать приём.\nПросто пиши свои задачи — бот сам подберёт оптимальное решение.",
    en: "✅ Готово\n\nТы зарегистрирован как пациент Doctor GPT.\n\nМожем начинать приём.\nПросто пиши свои задачи — бот сам подберёт оптимальное решение.",
  },
  openRouterStarted: {
    ru: "💭 Начинаю обрабатывать ваш запрос. Пожалуйста, подождите.",
    en: "Starting to process your request. Please wait.",
  },
  openRouterFetchingModels: {
    ru: "🤖 Получаю список моделей. Пожалуйста, подождите.",
    en: "Fetching models list. Please wait.",
  },
  openRouterDetectingLanguage: {
    ru: "👅 Определяю язык сообщения. Пожалуйста, подождите.",
    en: "Detecting message language. Please wait.",
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
    ru: "🪦 Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.",
    en: "An error occurred while processing your request. Please try again later.",
  },
  openRouterRequiredTelegamChannelSubscriptionError: {
    ru: `🧾 Перед началом приёма\n\nЧтобы пользоваться ботом, тебе нужно быть пациентом *Doctor GPT*.\n\nПодпишись на канал [*${telegramRequiredChannelName}*](${telegramRequiredChannelLink})`,
    en: `You need to subscribe to our Telegram channel  - [${telegramRequiredChannelName}](${telegramRequiredChannelLink}) to use this feature.`,
  },
  ecommerceModuleSelectSubscriptionProductsOffer: {
    ru: "💊 Выберите одну из наших подписок, чтобы продолжить или возвращайся завтра.",
    en: "Please select one of our subscription products to continue.",
  },
  openRouterNotFoundSubscription: {
    ru: "✨ У вас нет активной подписки. Пожалуйста, оформите подписку, чтобы использовать эту функцию.",
    en: "You do not have an active subscription. Please subscribe to use this feature.",
  },
  openRouterNotEnoughTokens: {
    ru: "⛔ Приём на сегодня завершён\n\nТы использовал бесплатный доступ.\n\n👑 Premium-пациент может продолжать приём без ограничений и получать ответы быстрее.\nВыбери, как продолжить",
    en: "У вас закончились токены для данного функционала. Дождитесь возобновления счетчика, выберите другую подписку или пополните баланс токенов",
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
