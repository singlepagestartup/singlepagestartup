"use client";
import { useEffect } from "react";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const { currencies, onCurrenciesResolved } = props;
  useEffect(() => {
    onCurrenciesResolved?.(currencies ?? []);
  }, [currencies, onCurrenciesResolved]);
  return props.children;
}
