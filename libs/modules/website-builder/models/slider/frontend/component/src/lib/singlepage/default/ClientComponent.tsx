"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div
      data-module="website-builder"
      data-model="slider"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
        // plugins={[
        //   Autoplay({
        //     delay: 8000,
        //   }) as any,
        // ]}
        className="relative w-full flex"
      >
        <CarouselContent className="w-full flex">
          {props.sliderToSlides?.map((entity, index) => {
            return (
              <CarouselItem key={index} className="w-full flex">
                {entity}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div
          className="w-2/12 inset-y-0 absolute cursor-pointer"
          onClick={() => {
            api?.scrollPrev();
          }}
        ></div>
        <div
          className="w-2/12 inset-y-0 right-0 absolute cursor-pointer"
          onClick={() => {
            api?.scrollNext();
          }}
        ></div>
      </Carousel>
    </div>
  );
}
