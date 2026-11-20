import { fieldClass } from "../../../shared/workflow-ui";
import type {
  WorkflowExchangeRate,
  WorkflowStage,
} from "../../../shared/workflows";
import { Field } from "./Fields";

const currencies = [
  { id: "sps", title: "SPS" },
  { id: "rub", title: "Рубли" },
  { id: "usd", title: "Доллары США" },
];
const rateFields = [
  { key: "rate", label: "Курс" },
  { key: "source", label: "Источник курса" },
  { key: "observedAt", label: "Дата курса с часовым поясом" },
] as const;

export function ResultPricing({
  stage,
  onChange,
}: {
  stage: WorkflowStage;
  onChange: (change: Partial<WorkflowStage>) => void;
}) {
  const pricing = stage.resultPricing;
  function changeRate(id: string, update: Partial<WorkflowExchangeRate>) {
    if (pricing?.kind === "confirmed-cost") {
      onChange({
        resultPricing: {
          ...pricing,
          conversions: pricing.conversions.map((rate) =>
            rate.id === id ? { ...rate, ...update } : rate,
          ),
        },
      });
    }
  }
  return (
    <>
      <Field label="Основание цены результата">
        <select
          className={fieldClass}
          value={pricing?.kind ?? "offer"}
          onChange={(event) =>
            onChange({
              resultPricing:
                event.currentTarget.value === "confirmed-cost"
                  ? { kind: "confirmed-cost", multiplier: "1", conversions: [] }
                  : undefined,
            })
          }
        >
          <option value="offer">Цена предложения</option>
          <option value="confirmed-cost">
            Подтверждённые затраты × коэффициент
          </option>
        </select>
      </Field>
      {pricing?.kind === "confirmed-cost" && (
        <div className="grid gap-3">
          <Field label="Коэффициент расчёта">
            <input
              className={fieldClass}
              value={pricing.multiplier}
              onChange={(event) =>
                onChange({
                  resultPricing: {
                    ...pricing,
                    multiplier: event.currentTarget.value,
                  },
                })
              }
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            Если расходы и цена указаны в разных валютах, задайте курс для
            каждой пары.
          </p>
          {pricing.conversions.map((rate) => (
            <div
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"
              key={rate.id}
            >
              {(
                [
                  ["fromCurrencyId", "Валюта расходов"],
                  ["toCurrencyId", "Валюта цены"],
                ] as const
              ).map(([key, label]) => (
                <Field label={label} key={key}>
                  <select
                    className={fieldClass}
                    value={rate[key]}
                    onChange={(event) =>
                      changeRate(rate.id, { [key]: event.currentTarget.value })
                    }
                  >
                    <option value="">Выберите валюту</option>
                    {currencies.map(({ id, title }) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
              {rateFields.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <input
                    className={fieldClass}
                    value={rate[key]}
                    placeholder={
                      key === "observedAt"
                        ? "2026-11-19T10:00:00+03:00"
                        : undefined
                    }
                    onChange={(event) =>
                      changeRate(rate.id, { [key]: event.currentTarget.value })
                    }
                  />
                </Field>
              ))}
              <button
                className="min-h-10 w-fit rounded-lg border border-border px-3 text-sm"
                type="button"
                onClick={() =>
                  onChange({
                    resultPricing: {
                      ...pricing,
                      conversions: pricing.conversions.filter(
                        ({ id }) => id !== rate.id,
                      ),
                    },
                  })
                }
              >
                Удалить курс
              </button>
            </div>
          ))}
          <button
            className="min-h-10 w-fit rounded-lg border border-border px-3 text-sm"
            disabled={pricing.conversions.length === 20}
            type="button"
            onClick={() =>
              onChange({
                resultPricing: {
                  ...pricing,
                  conversions: [
                    ...pricing.conversions,
                    {
                      id: crypto.randomUUID(),
                      fromCurrencyId: "",
                      toCurrencyId: "",
                      rate: "",
                      source: "",
                      observedAt: "",
                    },
                  ],
                },
              })
            }
          >
            Добавить курс
          </button>
        </div>
      )}
    </>
  );
}
