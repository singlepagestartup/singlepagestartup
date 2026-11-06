import type { IComponentProps, GalleryImage } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export type { GalleryImage, ProductGalleryProps } from "./interface";
export function ProductGallery({
  images = defaultProductGalleryProps.images,
  title,
  eyebrow,
  blockId,
  importedBlockId,
}: IComponentProps = {}) {
  return (
    <ClientComponent
      images={images}
      title={title}
      eyebrow={eyebrow}
      blockId={blockId}
      importedBlockId={importedBlockId}
    />
  );
}
const IMG_WEB =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
const IMG_SAAS =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png";
const IMG_UX =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png";
export const defaultProductGalleryProps = {
  images: [
    { src: IMG_WEB, alt: "Two people discussing ideas" },
    { src: IMG_SAAS, alt: "A moment of focus at work" },
    { src: IMG_UX, alt: "A person at work" },
  ] satisfies GalleryImage[],
};
