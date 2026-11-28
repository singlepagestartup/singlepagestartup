import { useState, type FormEvent } from "react";
import type { ICatalogContext } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import {
  PaymentTiming,
  offerPaymentSettings,
  offerPaymentTiming,
} from "../../../offer/create/PaymentTiming";

interface IProps {
  subjectId: string;
  offer: ICatalogContext["offers"][number];
  tokenId?: string;
  hasZeroPrice: boolean;
  language: string;
  onRefresh: () => Promise<unknown>;
}

export function ProductOfferPayment({
  subjectId,
  offer,
  tokenId,
  hasZeroPrice,
  language,
  onRefresh,
}: IProps) {
  const ru = language === "ru";
  const mutation = api.ecommerceModuleCatalogMutation();
  const [timing, setTiming] = useState(offerPaymentTiming(offer.settings));
  const [feedback, setFeedback] = useState("");
  const needsZeroPrice = timing === "work-formula" && !hasZeroPrice;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsZeroPrice) return;
    setFeedback("");
    try {
      await mutation.mutateAsync({
        id: subjectId,
        data: {
          entity: "stores-to-products",
          method: "PATCH",
          recordId: offer.id,
          data: {
            settings: offerPaymentSettings(timing, tokenId, offer.settings),
          },
        },
      });
      await onRefresh();
      setFeedback(ru ? "Условия оплаты сохранены." : "Payment terms saved.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось сохранить условия оплаты."
            : "Could not save payment terms.",
      );
    }
  }

  return (
    <form
      onSubmit={save}
      className="mb-5 grid gap-3 border-b border-border pb-5"
    >
      <h3 className="font-semibold">
        {ru ? "Предложение магазина" : "Store offer"} · {offer.sku}
      </h3>
      <PaymentTiming
        settings={offer.settings}
        currencyId={tokenId}
        language={language}
        onChange={setTiming}
      />
      {needsZeroPrice && (
        <p className="text-sm text-muted-foreground">
          {ru
            ? "В карточке товара сохраните цену 0 Token для этого предложения магазина."
            : "Save a checkout price of 0 Token for this store offer in the product details."}
        </p>
      )}
      <button
        className={settingsFormStyles.secondary}
        type="submit"
        disabled={
          mutation.isPending ||
          needsZeroPrice ||
          timing === offerPaymentTiming(offer.settings)
        }
      >
        {ru ? "Сохранить условия оплаты" : "Save payment terms"}
      </button>
      {feedback && (
        <p role="status" className="text-sm">
          {feedback}
        </p>
      )}
    </form>
  );
}
