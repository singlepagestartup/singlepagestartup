import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  loader?: unknown;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  unoptimized?: boolean;
};

export default function Image(props: ImageProps) {
  const {
    alt = "",
    fill,
    height,
    loader,
    priority,
    quality,
    sizes,
    style,
    unoptimized,
    width,
    ...rest
  } = props;

  return (
    <img
      alt={alt}
      height={fill ? undefined : height}
      width={fill ? undefined : width}
      style={
        fill
          ? {
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              ...style,
            }
          : style
      }
      {...rest}
    />
  );
}
