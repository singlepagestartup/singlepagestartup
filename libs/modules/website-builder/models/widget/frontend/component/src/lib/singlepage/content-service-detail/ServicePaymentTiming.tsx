import type { IServicePaymentTimingProps } from "./interface";

export function ServicePaymentTiming({
  language,
  afterAcceptance,
}: IServicePaymentTimingProps) {
  const labels =
    language === "ru"
      ? {
          acceptance: "Оплата после того, как вы примете версию в чате заказа.",
          checkout: "Оплата при оформлении заказа.",
        }
      : {
          acceptance:
            "Payment is due after you accept a version in the order chat.",
          checkout: "Payment is due at checkout.",
        };
  return <>{afterAcceptance ? labels.acceptance : labels.checkout}</>;
}
