import {
  ISpsLiteBackendButton,
  ISpsLiteBackendButtonsArray,
  ISpsLiteBackendFaq,
  ISpsLiteBackendFeature,
  ISpsLiteBackendInput,
  ISpsLiteBackendLogotype,
  ISpsLiteBackendSlide,
} from "types/components/elements/sps-lite";
import {
  spsLiteUploadPluginBackendMediaTableAndHands,
  spsLiteUploadPluginBackendMediaRoundIcon,
  spsLiteUploadPluginBackendMediaLogotypeIcon,
} from "~mocks/plugins/upload/sps-lite";

export const spsLiteBackendButtonDefault = {
  id: 4,
  title: `Button`,
  url: `https://nextjs.com`,
  variant: `default`,
  __component: `elements.button`,
} as ISpsLiteBackendButton;

export const spsLiteBackendButtonPrimary = {
  ...spsLiteBackendButtonDefault,
  variant: `primary`,
} as ISpsLiteBackendButton;

export const spsLiteBackendButtonBottomLine = {
  ...spsLiteBackendButtonDefault,
  variant: `bottom-line`,
} as ISpsLiteBackendButton;

export const spsLiteBackendButtonsArraySimple = {
  id: 5,
  __component: `elements.buttons-array`,
  title: `Buttons Array`,
  buttons: [spsLiteBackendButtonDefault, spsLiteBackendButtonDefault],
  variant: `simple`,
} as ISpsLiteBackendButtonsArray;

export const spsLiteBackendButtonsArrayDropdown = {
  ...spsLiteBackendButtonsArraySimple,
  variant: `dropdown`,
} as ISpsLiteBackendButtonsArray;

export const spsLiteBackendFaq = {
  id: 3,
  __component: `elements.faq`,
  title: `Конструктор блоков страниц`,
  description: `Навигационные элементы, Формы, Галерея фотографий, Текстовые блоки, CTA элементы и многое другое уже сделано, нужно просто воспользоваться этим в ваших интересах.`,
} as ISpsLiteBackendFaq;

export const spsLiteBackendFeature = {
  id: 136,
  __component: `elements.feature`,
  title: `Конструктор PageBlock'ов`,
  description: `Навигационные элементы, Формы, Галерея фотографий, Текстовые блоки, CTA элементы и многое другое уже сделано, нужно просто воспользоваться этим в ваших интересах.`,
  subtitle: `Не повторяйся`,
  media: [spsLiteUploadPluginBackendMediaRoundIcon],
} as ISpsLiteBackendFeature;

export const spsLiteBackendNameInput = {
  id: 56,
  __component: `elements.input`,
  placeholder: `Введите ваше имя`,
  component: `text`,
  isRequired: true,
  value: null,
  name: `name`,
  label: `Имя`,
  className: null,
  type: null,
  multiple: null,
  options: [],
} as ISpsLiteBackendInput;

export const spsLiteBackendEmailInput = {
  id: 57,
  __component: `elements.input`,
  placeholder: `Введите вашу электронную почту`,
  component: `text`,
  isRequired: true,
  value: null,
  name: `email`,
  label: `Электронная почта`,
  className: null,
  type: null,
  multiple: null,
  options: [],
} as ISpsLiteBackendInput;

export const spsLiteBackendTierInput = {
  id: 58,
  __component: `elements.input`,
  placeholder: `Выберите тариф`,
  component: `listbox`,
  isRequired: false,
  value: null,
  name: `tier`,
  label: `Тариф`,
  className: null,
  type: null,
  multiple: null,
  options: [
    {
      id: 24,
      title: `Lite`,
      description: null,
    },
    {
      id: 25,
      title: `Pro`,
      description: null,
    },
  ],
} as ISpsLiteBackendInput;

export const spsLiteBackendQuestionInput = {
  id: 59,
  __component: `elements.input`,
  placeholder: `Напишите ваш вопрос`,
  component: `text`,
  isRequired: false,
  value: null,
  name: `querstion`,
  label: `Вопрос`,
  className: null,
  type: `textarea`,
  multiple: null,
  options: [],
} as ISpsLiteBackendInput;

export const spsLiteBackendPolicyInput = {
  id: 60,
  __component: `elements.input`,
  placeholder: null,
  component: `switch`,
  isRequired: true,
  value: null,
  name: `policy`,
  label: `Я согласен с Политикой конфиденциальности`,
  className: null,
  type: null,
  multiple: null,
  options: [],
} as ISpsLiteBackendInput;

export const spsLiteBackendLogotype = {
  id: 5,
  __component: `elements.logotype`,
  media: [spsLiteUploadPluginBackendMediaLogotypeIcon],
  additionalMedia: null,
  title: ``,
  url: `https://singlepagestartup.com`,
} as ISpsLiteBackendLogotype;

export const spsLiteBackendSlide = {
  id: 1,
  __component: `elements.slide`,
  title: `Конструктор блоков страниц`,
  description: `Навигационные элементы, Формы, Галерея фотографий, Текстовые блоки, CTA элементы и многое другое уже сделано, нужно просто воспользоваться этим в ваших интересах.`,
  media: [spsLiteUploadPluginBackendMediaTableAndHands],
  buttons: [spsLiteBackendButtonDefault],
} as ISpsLiteBackendSlide;
