import {
  stageCompletionCondition,
  stageWorkCapabilities,
  stageWorkFunding,
  stageWorkModelSelection,
  type IFunnelDefinition,
  type IFunnelStage,
} from "@sps/crm/models/funnel/sdk/model";
import {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
} from "@sps/shared-utils";
import type {
  ICustomerWorkRate,
  ICustomerWorkTokenRate,
  ICustomerWorkTokenTariff,
} from "@sps/rbac/models/subject/sdk/model";
import Decimal from "decimal.js";
import { TokenTopupRate } from "../../billing/token-topup-rate";

export function meteredOrderStages(
  definition: IFunnelDefinition,
  pricing: { currencyId: string; multiplier: string },
) {
  const stages = definition.stages.filter(({ archived }) => !archived);
  const funded = stages.every((stage) => {
    const funding = stageWorkFunding(definition, stage);
    return (
      funding?.payer === "customer" &&
      funding.multiplier === pricing.multiplier &&
      funding.currencyId === pricing.currencyId
    );
  });
  if (
    funded &&
    stages.some(({ resultPricing }) => resultPricing?.kind === "work-tokens")
  ) {
    return stages;
  }
  return undefined;
}

export function customerWorkRateCapabilities(
  definition: Pick<IFunnelDefinition, "progression">,
  stage: IFunnelStage,
) {
  const required = new Set(stageWorkCapabilities(stage));
  if (definition.progression === "linear" && stageCompletionCondition(stage)) {
    required.add("decision");
  }
  return required;
}

export function workTokenTariff(
  rates: ICustomerWorkRate[],
): ICustomerWorkTokenTariff {
  const distinct = new Map<string, ICustomerWorkTokenRate>();
  for (const rate of rates) {
    const perToken = (usd: string) =>
      TokenTopupRate.workCharge(usd, rate).div(1_000_000).toFixed();
    const item: ICustomerWorkTokenRate = {
      capability: rate.capability,
      model: rate.model,
      input: perToken(rate.inputUsdPerMillion),
      output:
        rate.capability === "embedding"
          ? undefined
          : perToken(rate.outputUsdPerMillion),
      cachedInput:
        rate.cachedInputUsdPerMillion === undefined
          ? undefined
          : perToken(rate.cachedInputUsdPerMillion),
      cacheWrite:
        rate.cacheWriteUsdPerMillion === undefined
          ? undefined
          : perToken(rate.cacheWriteUsdPerMillion),
    };
    distinct.set(JSON.stringify(item), item);
  }
  return { rates: Array.from(distinct.values()) };
}

export function customerWorkRateNotice(input: {
  stage: IFunnelStage;
  initial: boolean;
  rates: ICustomerWorkRate[];
  currency: string;
  requestMaximum?: string;
  taskMaximum?: string;
}) {
  const { stage, initial, rates, currency, requestMaximum, taskMaximum } =
    input;
  const ru = /\p{Script=Cyrillic}/u.test(stage.name);
  const reasoning = stageWorkModelSelection(stage, "text")?.reasoning;
  const labels = {
    text: ru ? "Текст" : "Text",
    image: ru ? "Изображения" : "Images",
    embedding: ru ? "Поиск по материалам" : "Knowledge search",
    decision: ru ? "Проверка этапа" : "Stage check",
    compression: ru ? "Сжатие истории" : "History compression",
    vision: ru ? "Анализ изображений" : "Image analysis",
    transcription: ru ? "Расшифровка аудио" : "Audio transcription",
  };
  const amount = (value: string) => {
    const [integer, fraction] = value.split(".");
    const grouped = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ru ? "\u00a0" : ",",
    );
    return fraction ? `${grouped}${ru ? "," : "."}${fraction}` : grouped;
  };
  const unitRate = (value: string) => {
    const exact = new Decimal(value);
    const rounded = exact.toSignificantDigits(8);
    return `${rounded.eq(exact) ? "" : "≈ "}${amount(rounded.toFixed())}`;
  };
  const detail = workTokenTariff(rates).rates.map((rate) => {
    const model =
      rate.model === OPEN_AI_STAGE_TEXT_DEFAULT.modelId
        ? OPEN_AI_STAGE_TEXT_MODEL_LABEL
        : rate.model;
    const effort =
      rate.capability === "text" && reasoning ? ` · ${reasoning}` : "";
    const inputs = [`${ru ? "вход" : "input"} ${unitRate(rate.input)}`];
    if (rate.output !== undefined) {
      inputs.push(`${ru ? "выход" : "output"} ${unitRate(rate.output)}`);
    }
    if (rate.cachedInput !== undefined) {
      inputs.push(
        `${ru ? "вход из кэша" : "cached input"} ${unitRate(rate.cachedInput)}`,
      );
    }
    if (rate.cacheWrite !== undefined) {
      inputs.push(
        `${ru ? "запись в кэш" : "cache write"} ${unitRate(rate.cacheWrite)}`,
      );
    }
    return `- ${labels[rate.capability]}, ${model}${effort} — ${inputs.join(", ")}`;
  });
  const intro = initial
    ? ru
      ? "Здравствуйте! Помогу разобраться с задачей и подготовить результат. Расскажите, чем занимается ваш бизнес, что вы предлагаете и кому. Пришлите ссылку на сайт или приложите материалы, если они есть."
      : "Hello! I’ll help you clarify the task and prepare the result. Tell me about your business, what you offer, and who you serve. Share your website or attach any materials you already have."
    : ru
      ? `Продолжаю работу. Следующий этап — «${stage.name}».`
      : `The next stage is “${stage.name}”.`;
  const tariff = ru
    ? `Тариф за 1 токен модели в ${currency}`
    : `Rate per model token in ${currency}`;
  const cap = requestMaximum
    ? ru
      ? `За одно обращение — до ${amount(requestMaximum)} ${currency}.`
      : `Up to ${amount(requestMaximum)} ${currency} per request.`
    : "";
  const budget = taskMaximum
    ? ru
      ? `За всю работу по задаче — до ${amount(taskMaximum)} ${currency}.`
      : `Up to ${amount(taskMaximum)} ${currency} for the whole task.`
    : "";
  const consent = ru
    ? "Подтвердите тариф. С кошелька спишется стоимость токенов и операций, которые понадобятся для ответа."
    : "Approve the rate to continue. Your wallet pays for the tokens and operations used for the reply.";
  return {
    text: [intro, tariff, detail.join("\n"), cap, budget, consent]
      .filter(Boolean)
      .join("\n\n"),
    button: ru ? "Подтвердить тариф" : "Approve rate",
  };
}

export function criteria(fields: Record<string, string | boolean>) {
  return {
    params: {
      filters: {
        and: Object.entries(fields).map(([column, value]) => ({
          column,
          method: "eq" as const,
          value,
        })),
      },
    },
  };
}

export function inIds(
  column: string,
  values: Iterable<string>,
  fields: Record<string, string | boolean> = {},
) {
  return {
    params: {
      filters: {
        and: [
          ...criteria(fields).params.filters.and,
          { column, method: "inArray" as const, value: [...new Set(values)] },
        ],
      },
    },
  };
}
