"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import type {
  IOfferPriceProps,
  IOfferPriceProviderProps,
  IOfferPriceSelection,
} from "./interface";

interface IPriceSelection extends IOfferPriceSelection {
  sourceId: string;
}

const PriceSelection = createContext<IPriceSelection | null>(null);
const SetPriceSelection = createContext<Dispatch<
  SetStateAction<IPriceSelection | null>
> | null>(null);

export function OfferPriceProvider({ children }: IOfferPriceProviderProps) {
  const [selection, setSelection] = useState<IPriceSelection | null>(null);
  return (
    <SetPriceSelection.Provider value={setSelection}>
      <PriceSelection.Provider value={selection}>
        {children}
      </PriceSelection.Provider>
    </SetPriceSelection.Provider>
  );
}

export function OfferPrice(props: IOfferPriceProps) {
  const selection = useContext(PriceSelection);
  if (
    !selection ||
    selection.productId !== props.product.id ||
    (props.storeId && selection.storeId !== props.storeId)
  )
    return props.children;
  return (
    <Store
      isServer={false}
      variant="product-price-default"
      product={props.product}
      storeId={selection.storeId}
      offerId={selection.offerId}
      billingModuleCurrencyId={selection.billingModuleCurrencyId}
      language={props.language}
      readOnly
    />
  );
}

export function useOfferPriceSelection(selection: IOfferPriceSelection | null) {
  const setSelection = useContext(SetPriceSelection);
  const sourceId = useId();
  const productId = selection?.productId;
  const storeId = selection?.storeId;
  const offerId = selection?.offerId;
  const billingModuleCurrencyId = selection?.billingModuleCurrencyId;
  useEffect(() => {
    if (!setSelection || !productId || !offerId || !billingModuleCurrencyId)
      return;
    setSelection({
      sourceId,
      productId,
      storeId,
      offerId,
      billingModuleCurrencyId,
    });
    return () => {
      setSelection((current) =>
        current?.sourceId === sourceId ? null : current,
      );
    };
  }, [
    setSelection,
    sourceId,
    productId,
    storeId,
    offerId,
    billingModuleCurrencyId,
  ]);
}
