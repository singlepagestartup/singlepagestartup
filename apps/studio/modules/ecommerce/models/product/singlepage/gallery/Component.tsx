"use client";

import * as React from "react";
import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowLeft,
  ArrowRight,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "./Carousel";

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface ProductGalleryProps {
  images?: GalleryImage[];
  blockId?: string;
  importedBlockId?: string;
}

const IMG_WEB = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  import.meta.url,
).href;
const IMG_SAAS = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png",
  import.meta.url,
).href;
const IMG_UX = new URL(
  "../../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png",
  import.meta.url,
).href;

export const defaultProductGalleryProps = {
  images: [
    { src: IMG_WEB, alt: "Two people discussing ideas" },
    { src: IMG_SAAS, alt: "A moment of focus at work" },
    { src: IMG_UX, alt: "A person at work" },
  ] satisfies GalleryImage[],
};

export function ProductGallery(props?: ProductGalleryProps) {
  const images = props?.images ?? defaultProductGalleryProps.images;
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
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
            A closer look
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--workspace-brand-foreground)] sm:text-4xl">
            Project gallery
          </h2>
        </div>
        <div
          className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
          onKeyDown={handleGalleryKeyDown}
        >
          <Carousel
            aria-label="Project gallery"
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
          <div className="space-y-4 border-t border-[var(--workspace-brand-line)] p-5">
            <div className="flex flex-wrap gap-2" aria-label="Gallery images">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  aria-current={index === active ? "true" : undefined}
                  aria-label={`Show gallery image ${index + 1}`}
                  className={`h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${index === active ? "border-[var(--workspace-brand-foreground)]" : "border-transparent opacity-70 hover:opacity-100"}`}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                aria-live="polite"
                className="text-sm text-[var(--workspace-brand-muted)]"
              >
                {active + 1} of {total}
              </p>
              {total > 1 ? (
                <div className="flex gap-2">
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
          </div>
        </div>
      </div>
    </section>
  );
}
