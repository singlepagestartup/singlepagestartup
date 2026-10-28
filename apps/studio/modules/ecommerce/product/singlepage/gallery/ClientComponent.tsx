"use client";
import type {
  IComponentProps,
  GalleryImage,
  ProductGalleryProps,
} from "./interface";
export type { GalleryImage, ProductGalleryProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import * as React from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "./Carousel";
interface IModuleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = React.forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component(props?: IComponentProps) {
  const images = props?.images ?? [];
  const blockId = props?.blockId ?? "ecommerce.product.gallery";
  const total = images.length;
  const [active, setActive] = React.useState(0);
  const [api, setApi] = React.useState<CarouselApi>();
  const handleSelect = React.useCallback(
    (index: number) => {
      setActive(index);
      api?.scrollTo(index);
    },
    [api],
  );
  const handleGalleryKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        api?.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        api?.scrollNext();
      }
    },
    [api],
  );
  React.useEffect(() => {
    if (!api) {
      return;
    }
    const updateActiveSlide = () => {
      const selectedIndex = api.selectedScrollSnap();
      setActive(selectedIndex);
    };
    updateActiveSlide();
    api.on("reInit", updateActiveSlide);
    api.on("select", updateActiveSlide);
    return () => {
      api.off("reInit", updateActiveSlide);
      api.off("select", updateActiveSlide);
    };
  }, [api]);
  if (total === 0) return null;
  return (
    <section
      className="w-full py-12 sm:py-16"
      data-ds-block={blockId}
      data-ds-imports={props?.importedBlockId}
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "gallery"}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">
            {props?.eyebrow ?? "A closer look"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {props?.title ?? "Project gallery"}
          </h2>
        </div>
        <div
          className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card"
          onKeyDown={handleGalleryKeyDown}
        >
          <div className="group relative">
            <Carousel
              aria-label={props?.title ?? "Project gallery"}
              setApi={setApi}
              className="w-full"
              opts={{ loop: total > 1 }}
            >
              <CarouselContent className="ml-0">
                {images.map((image) => (
                  <CarouselItem key={image.src} className="pl-0">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="block aspect-square w-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {total > 1 ? (
              <div className="absolute bottom-4 right-4 flex gap-2 rounded-2xl bg-card/80 p-1.5 opacity-100 backdrop-blur-sm transition-opacity motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100 sm:bottom-6 sm:right-6 [@media(hover:hover)]:opacity-0">
                <Button
                  variant="secondary"
                  aria-label="Show previous gallery image"
                  className="h-11 w-11 px-0"
                  onClick={() => api?.scrollPrev()}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  aria-label="Show next gallery image"
                  className="h-11 w-11 px-0"
                  onClick={() => api?.scrollNext()}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="space-y-4 border-t border-border p-5">
            <div className="flex flex-wrap gap-2" aria-label="Gallery images">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  aria-current={index === active ? "true" : undefined}
                  aria-label={`Show gallery image ${index + 1}`}
                  className={`h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${index === active ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"}`}
                  onClick={() => handleSelect(index)}
                  type="button"
                >
                  <img
                    src={image.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p aria-live="polite" className="sr-only">
              Image {active + 1} of {total}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
const ArrowRight = createIcon("arrow-right");
const ArrowLeft = createIcon("arrow-left");
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
