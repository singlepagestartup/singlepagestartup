import { customerStageFunding } from "@sps/crm/models/funnel/sdk/model";
import type {
  IFunnelStage,
  IWorkFunding,
} from "@sps/crm/models/funnel/sdk/model";
import type { ICrmWorkspaceOptions } from "@sps/rbac/models/subject/sdk/model";
import { TextField } from "../../../../../subject-me-crm-module-store-workspace/Fields";

interface IStageFundingProps {
  stage: IFunnelStage;
  legacyFunding?: IWorkFunding;
  options: ICrmWorkspaceOptions;
  onChange: (patch: Partial<IFunnelStage>) => void;
}

export function StageFunding({
  stage,
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

  return (
    <div className="grid gap-3">
      {stage.workFunding?.payer !== "customer" &&
        (stage.workFunding || legacyFunding) && (
          <p className="text-sm text-foreground">
            Сейчас действуют прежние условия оплаты. При сохранении ставка для
            клиента станет нулевой. Чтобы брать плату за новые вызовы ИИ,
            укажите коэффициент.
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
        умножается на коэффициент. При 0 этап бесплатен для клиента.
      </p>
    </div>
  );
}
