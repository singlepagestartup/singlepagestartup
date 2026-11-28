"use client";

import {
  Component as Subject,
  WorkTokenTariff,
} from "@sps/rbac/models/subject/frontend/component";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import type { IServiceTokenPriceProps } from "./interface";

interface ITokenPriceProps extends IServiceTokenPriceProps {
  subjectId: string;
}

interface ITariffStatusProps {
  language: string;
  pending?: boolean;
}

function TariffStatus({ language, pending }: ITariffStatusProps) {
  const labels =
    language === "ru"
      ? { pending: "Загружаем тариф…", unavailable: "Тариф сейчас недоступен." }
      : {
          pending: "Loading the rate…",
          unavailable: "The rate is currently unavailable.",
        };
  return (
    <span role="status" className="text-sm text-muted-foreground">
      {pending ? labels.pending : labels.unavailable}
    </span>
  );
}

function TokenPrice({
  subjectId,
  ecommerceModuleStoreId,
  ecommerceModuleProductId,
  ecommerceModuleOfferId,
  language,
}: ITokenPriceProps) {
  const { data, isPending, error } = subjectApi.customerWorkAvailability({
    id: subjectId,
    storeId: ecommerceModuleStoreId,
    productId: ecommerceModuleProductId,
    offerId: ecommerceModuleOfferId,
  });
  const tariff = data?.workTokenTariff;
  const status = error && "status" in error ? error.status : undefined;
  if (tariff?.rates.length && status !== 401 && status !== 403) {
    return <WorkTokenTariff tariff={tariff} language={language} compact />;
  }

  return <TariffStatus language={language} pending={isPending} />;
}

export function ServiceTokenPrice({
  ecommerceModuleProductId,
  ecommerceModuleStoreId,
  ecommerceModuleOfferId,
  language,
}: IServiceTokenPriceProps) {
  const unavailable = <TariffStatus language={language} />;
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      waitForAuthenticationInit
      skeleton={<TariffStatus language={language} pending />}
      fallback={unavailable}
    >
      {({ data }) =>
        data ? (
          <TokenPrice
            subjectId={data.id}
            ecommerceModuleProductId={ecommerceModuleProductId}
            ecommerceModuleStoreId={ecommerceModuleStoreId}
            ecommerceModuleOfferId={ecommerceModuleOfferId}
            language={language}
          />
        ) : (
          unavailable
        )
      }
    </Subject>
  );
}
