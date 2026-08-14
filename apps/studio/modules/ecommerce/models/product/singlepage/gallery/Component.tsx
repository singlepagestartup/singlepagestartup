"use client";

import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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

const IMG_WEB =
  "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_SAAS =
  "https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTYWFTJTIwc29mdHdhcmUlMjBkYXNoYm9hcmQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzcxNzE2NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_UX =
  "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVWCUyMGRlc2lnbiUyMHdpcmVmcmFtZSUyMHNrZXRjaHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultProductGalleryProps = {
  images: [
    { src: IMG_WEB, alt: "Gallery 1" },
    { src: IMG_SAAS, alt: "Gallery 2" },
    { src: IMG_UX, alt: "Gallery 3" },
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

  if (total === 0) {
    return null;
  }

  return (
    <section
      className="py-16"
      data-ds-block={blockId}
      data-ds-imports={props?.importedBlockId}
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
              Portfolio
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">
              Project Gallery
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {active + 1} / {total}
          </span>
        </div>

        <Carousel setApi={setApi} className="w-full" opts={{ loop: total > 1 }}>
          <CarouselContent className="ml-0">
            {images.map((image) => (
              <CarouselItem key={image.src} className="pl-0">
                <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="aspect-[2/1] w-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {total > 1 ? (
            <>
              <button
                aria-label="Show previous gallery image"
                className="absolute inset-y-0 left-0 z-10 w-1/5 bg-transparent transition hover:bg-slate-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                onClick={() => api?.scrollPrev()}
                type="button"
              />
              <button
                aria-label="Show next gallery image"
                className="absolute inset-y-0 right-0 z-10 w-1/5 bg-transparent transition hover:bg-slate-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                onClick={() => api?.scrollNext()}
                type="button"
              />
              <CarouselPrevious className="left-4 z-20" />
              <CarouselNext className="right-4 z-20" />
              <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.src}
                    aria-current={index === active ? "true" : undefined}
                    aria-label={`Show gallery image ${index + 1}`}
                    className={`h-2.5 rounded-full border border-white/70 transition ${
                      index === active
                        ? "w-7 bg-white shadow-sm"
                        : "w-2.5 bg-white/55 hover:bg-white/85"
                    }`}
                    onClick={() => handleSelect(index)}
                    type="button"
                  />
                ))}
              </div>
            </>
          ) : null}
        </Carousel>
      </div>
    </section>
  );
}
