import { Select } from "@sps/ui-adapter";
import { Plus, Trash2 } from "lucide-react";
import type {
  IFunnelStage,
  IResultConversion,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceOptions } from "@sps/rbac/models/subject/sdk/model";
import { fieldClass, iconButtonClass, secondaryClass } from "../primitives";
import { Field, TextField } from "./Fields";

interface IResultPricingProps {
  stage: IFunnelStage;
  currencies: ICrmWorkspaceOptions["currencies"];
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function ResultPricing({
  stage,
  currencies,
  onChange,
}: IResultPricingProps) {
  const pricing = stage.resultPricing;
  function changeRate(index: number, update: Partial<IResultConversion>) {
    if (pricing?.kind === "confirmed-cost") {
      onChange({
        resultPricing: {
          ...pricing,
          conversions: pricing.conversions.map((rate, position) =>
            position === index ? { ...rate, ...update } : rate,
          ),
        },
      });
    }
  }
  return (
    <>
      <Field label="Основание цены результата">
        <Select
          ui="shadcn"
          className={fieldClass}
          value={pricing?.kind ?? "offer"}
          disabled={stage.archived}
          onValueChange={(selectedValue) =>
            onChange({
              resultPricing:
                selectedValue === "confirmed-cost"
                  ? { kind: "confirmed-cost", multiplier: "1", conversions: [] }
                  : undefined,
            })
          }
          options={[
            { value: "offer", label: "Цена предложения" },
            {
              value: "confirmed-cost",
              label: "Подтверждённые затраты × коэффициент",
            },
          ]}
        />
      </Field>
      {pricing?.kind === "confirmed-cost" && (
        <div className="grid gap-3">
          <TextField
            label="Коэффициент расчёта"
            value={pricing.multiplier}
            onChange={(multiplier) =>
              onChange({ resultPricing: { ...pricing, multiplier } })
            }
          />
          <p className="text-sm text-muted-foreground">
            Если расходы и цена указаны в разных валютах, задайте курс для
            каждой пары.
          </p>
          {pricing.conversions.map((rate, index) => (
            <div
              key={rate.id ?? index}
              className="grid gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  className={iconButtonClass}
                  aria-label={`Удалить курс ${index + 1}`}
                  onClick={() =>
                    onChange({
                      resultPricing: {
                        ...pricing,
                        conversions: pricing.conversions.filter(
                          (_, position) => position !== index,
                        ),
                      },
                    })
                  }
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Валюта расходов">
                  <Select
                    ui="shadcn"
                    className={fieldClass}
                    value={rate.fromCurrencyId || "none"}
                    disabled={stage.archived}
                    onValueChange={(selectedValue) =>
                      changeRate(index, {
                        fromCurrencyId:
                          selectedValue === "none" ? "" : selectedValue,
                      })
                    }
                    options={[
                      { value: "none", label: "Выберите валюту" },
                      ...currencies.map(({ id, title }) => ({
                        value: id,
                        label: title,
                      })),
                    ]}
                  />
                </Field>
                <Field label="Валюта цены">
                  <Select
                    ui="shadcn"
                    className={fieldClass}
                    value={rate.toCurrencyId || "none"}
                    disabled={stage.archived}
                    onValueChange={(selectedValue) =>
                      changeRate(index, {
                        toCurrencyId:
                          selectedValue === "none" ? "" : selectedValue,
                      })
                    }
                    options={[
                      { value: "none", label: "Выберите валюту" },
                      ...currencies.map(({ id, title }) => ({
                        value: id,
                        label: title,
                      })),
                    ]}
                  />
                </Field>
                <TextField
                  label="Курс"
                  value={rate.rate}
                  onChange={(value) => changeRate(index, { rate: value })}
                />
                <TextField
                  label="Источник курса"
                  value={rate.source}
                  onChange={(source) => changeRate(index, { source })}
                />
                <Field label="Дата курса с часовым поясом">
                  <input
                    className={fieldClass}
                    value={rate.observedAt}
                    placeholder="2026-11-19T10:00:00+03:00"
                    onChange={(event) =>
                      changeRate(index, {
                        observedAt: event.currentTarget.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={`${secondaryClass} w-fit`}
            disabled={pricing.conversions.length === 20}
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
            <Plus aria-hidden="true" className="size-4" /> Добавить курс
          </button>
        </div>
      )}
    </>
  );
}
