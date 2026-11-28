import { customerStageFunding } from "@sps/crm/models/funnel/sdk/model";
import type {
  IFunnelStage,
  IWorkFunding,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceOptions } from "@sps/rbac/models/subject/sdk/model";
import { TextField } from "../../../../../subject-me-crm-module-store-workspace/Fields";

interface IStageFundingProps {
  stage: IFunnelStage;
  individualService: boolean;
  language: string;
  legacyFunding?: IWorkFunding;
  options: ICrmWorkspaceOptions;
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function StageFunding({
  stage,
  individualService,
  language,
  legacyFunding,
  options,
  onChange,
}: IStageFundingProps) {
  const token = options.currencies.find(
    (item) => item.slug?.toLowerCase() === "token",
  );
  const funding = customerStageFunding(stage, token?.id ?? "");

  function update(patch: Partial<typeof funding>) {
    onChange({ workFunding: { ...funding, ...patch } });
  }

  const ru = language === "ru";
  return (
    <div className="grid gap-3">
      {individualService && !stage.resultPricing && (
        <label className="grid gap-2 text-sm font-medium">
          {ru ? "Как рассчитывать стоимость работы" : "Work pricing"}
          <select
            className="min-h-11 rounded-xl border border-input bg-background px-3"
            value={funding.orderFormula ? "formula" : "stage"}
            onChange={(event) =>
              update(
                event.target.value === "formula"
                  ? { orderFormula: true, multiplier: undefined }
                  : { orderFormula: undefined, multiplier: "0" },
              )
            }
          >
            <option value="formula">
              {ru ? "По формуле товара" : "Product pricing formula"}
            </option>
            <option value="stage">
              {ru ? "Коэффициент этапа" : "Stage multiplier"}
            </option>
          </select>
        </label>
      )}
      {funding.orderFormula ? (
        <p className="text-sm text-muted-foreground">
          {ru
            ? "Стоимость выполненной работы определяется формулой товара в разделе «Тариф»."
            : "Completed work uses the formula in the product’s Pricing formula tab."}
        </p>
      ) : (
        <>
          {stage.workFunding?.payer !== "customer" &&
            (stage.workFunding || legacyFunding) && (
              <p className="text-sm text-foreground">
                Сейчас действуют прежние условия оплаты. При сохранении ставка
                для клиента станет нулевой. Чтобы брать плату за новые вызовы
                ИИ, укажите коэффициент.
              </p>
            )}
          {!token && (
            <p role="status" className="text-sm text-muted-foreground">
              Валюта Token недоступна.
            </p>
          )}
          <TextField
            label="Коэффициент стоимости для клиента"
            value={funding.multiplier ?? "0"}
            onChange={(multiplier) => update({ multiplier })}
          />
          <p className="text-sm text-muted-foreground">
            Стоимость вызова модели переводится в Token по курсу пополнения и
            умножается на коэффициент.{" "}
            {stage.resultPricing?.kind === "work-tokens"
              ? "Для этого этапа коэффициент должен быть больше нуля."
              : "При 0 этап бесплатен для клиента."}
          </p>
        </>
      )}
    </div>
  );
}
