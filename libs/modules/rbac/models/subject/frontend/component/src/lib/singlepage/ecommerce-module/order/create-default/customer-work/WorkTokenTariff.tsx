import type {
  ICustomerWorkTokenRate,
  ICustomerWorkTokenTariff,
} from "@sps/rbac/models/subject/sdk/model";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
} from "@sps/shared-utils";
import Decimal from "decimal.js";

export interface IWorkTokenTariffProps {
  tariff: ICustomerWorkTokenTariff;
  language: string;
  compact?: boolean;
}

export function WorkTokenTariff({
  tariff,
  language,
  compact,
}: IWorkTokenTariffProps) {
  const ru = language === "ru";
  const title = ru ? "Тариф за 1 токен модели" : "Rate per model token";
  const models = tariff.rates.filter(
    ({ capability }) => capability === "text" || capability === "image",
  );
  const tools = tariff.rates.filter(
    ({ capability }) => capability !== "text" && capability !== "image",
  );
  const cachedModels = models.filter(
    ({ cachedInput, cacheWrite }) =>
      cachedInput !== undefined || cacheWrite !== undefined,
  );
  const labels = {
    embedding: ru ? "Поиск по материалам" : "Knowledge search",
    decision: ru ? "Выбор действия" : "Routing",
    compression: ru ? "Сжатие истории чата" : "Chat history compression",
    vision: ru ? "Анализ изображений" : "Image analysis",
    transcription: ru ? "Расшифровка аудио" : "Audio transcription",
  };
  const modelName = ({ model }: ICustomerWorkTokenRate) =>
    model === OPEN_AI_STAGE_TEXT_DEFAULT.modelId
      ? OPEN_AI_STAGE_TEXT_MODEL_LABEL
      : model;
  const input = ru ? "Вход (запрос)" : "Input (request)";
  const output = ru ? "Выход (ответ)" : "Output (response)";

  function row(label: string, amount: string | undefined) {
    if (amount === undefined) return null;
    const value = new Decimal(amount);
    const display = value.toSignificantDigits(8);
    const approximate = !display.eq(value);
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <dt>{label}</dt>
        <dd
          className="font-medium tabular-nums text-foreground [overflow-wrap:anywhere]"
          title={
            approximate ? formatCurrencyAmount(amount, language) : undefined
          }
        >
          {approximate ? "≈ " : ""}
          {formatCurrencyAmount(display.toFixed(), language)}
        </dd>
      </div>
    );
  }

  return (
    <section
      aria-label={title}
      className={
        compact ? "space-y-2" : "space-y-3 rounded-xl border border-border p-3"
      }
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {ru ? "Суммы в токенах кошелька SPS" : "Amounts in SPS wallet tokens"}
        </p>
      </div>
      {models.map((rate) => (
        <div key={`${rate.capability}:${rate.model}`} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {modelName(rate)}
          </p>
          <dl className="space-y-1 text-sm text-muted-foreground">
            {row(input, rate.input)}
            {row(output, rate.output)}
          </dl>
        </div>
      ))}
      {cachedModels.length > 0 || tools.length > 0 ? (
        <details className="space-y-2 border-t border-border pt-2">
          <summary className="cursor-pointer text-xs font-medium">
            {ru
              ? "Кэш и дополнительные операции"
              : "Cache and additional operations"}
          </summary>
          {cachedModels.map((rate) => (
            <div
              key={`${rate.capability}:${rate.model}`}
              className="space-y-1 text-xs"
            >
              {models.length > 1 ? (
                <p className="font-medium">{modelName(rate)}</p>
              ) : null}
              <dl className="space-y-1 text-muted-foreground">
                {row(ru ? "Вход из кэша" : "Cached input", rate.cachedInput)}
                {row(ru ? "Запись в кэш" : "Cache write", rate.cacheWrite)}
              </dl>
            </div>
          ))}
          {tools.map((rate) => {
            const label = labels[rate.capability as keyof typeof labels];
            const toolInput =
              rate.capability === "embedding"
                ? ru
                  ? "Поисковый запрос"
                  : "Search query"
                : input;
            return (
              <div
                key={`${rate.capability}:${rate.model}`}
                className="space-y-1 text-xs"
              >
                <p className="font-medium">{label}</p>
                <dl className="space-y-1 text-muted-foreground">
                  {row(toolInput, rate.input)}
                  {row(output, rate.output)}
                </dl>
              </div>
            );
          })}
        </details>
      ) : null}
    </section>
  );
}
