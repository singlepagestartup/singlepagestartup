import type { IServicePaymentTimingProps } from "./interface";

export function ServicePaymentTiming({
  language,
  afterAcceptance,
  workMetered,
}: IServicePaymentTimingProps) {
  if (workMetered) {
    return (
      <>
        {language === "ru"
          ? "Токены списываются за работу ИИ по тарифу, который вы подтвердите в чате."
          : "AI work uses tokens from your balance at the rate you approve in chat."}
      </>
    );
  }
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
