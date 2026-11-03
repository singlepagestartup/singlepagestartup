"use client";
import { useCallback } from "react";
import type { IComponentProps } from "./interface";
import type { IProductCardSelection } from "../card/interface";
import { ProductCard, defaultProductCardProps } from "../card/Component";
export function Component(props: IComponentProps) {
  const handleAdd = useCallback(
    (selection: IProductCardSelection) => {
      props.onAddToCart?.(
        {
          id: props.id!,
          slug: props.slug!,
          image: props.image!,
          title: props.title!,
          priceLabel: props.priceLabel!,
          price: props.price!,
        },
        selection.quantity,
      );
    },
    [
      props.onAddToCart,
      props.id,
      props.slug,
      props.image,
      props.title,
      props.priceLabel,
      props.price,
    ],
  );
  return (
    <section
      id="product-purchase"
      data-module="ecommerce"
      data-model="product"
      data-variant="overview-purchase"
      data-ds-block={props.blockId ?? "ecommerce.product.overview-purchase"}
      data-ds-layer="singlepage"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 sm:p-8">
          <h2 className="text-3xl font-semibold">What you get</h2>
          <ul className="mt-6 space-y-4">
            {props.deliverables?.map((item) => (
              <li
                key={item}
                className="border-b border-border pb-4 text-base leading-7 text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <ProductCard
          {...defaultProductCardProps}
          {...props.card}
          id={props.id}
          slug={props.slug}
          image={props.image}
          title={props.title}
          showMedia={false}
          onAddToCart={handleAdd}
        />
      </div>
    </section>
  );
}
