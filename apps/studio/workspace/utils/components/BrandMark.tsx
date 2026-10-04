export interface BrandMarkProps {
  size?: "sm" | "md";
  inverse?: boolean;
}

const lightMark = new URL(
  "../../assets/singlepage/intake/operator-logo-square-white.svg",
  import.meta.url,
).href;
const darkMark = new URL(
  "../../assets/singlepage/intake/operator-logo-square-black.svg",
  import.meta.url,
).href;

export function BrandMark({ size = "md", inverse = false }: BrandMarkProps) {
  return (
    <img
      aria-hidden="true"
      alt=""
      className={`block shrink-0 object-contain ${size === "sm" ? "size-6" : "size-8"}`}
      src={inverse ? darkMark : lightMark}
    />
  );
}
