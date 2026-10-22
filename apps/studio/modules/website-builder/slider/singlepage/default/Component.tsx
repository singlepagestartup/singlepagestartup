import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { defaultSlideProps } from "../../../slide";
export const defaultSliderProps = {
  label: "Framework gallery",
  slides: [
    defaultSlideProps,
    {
      ...defaultSlideProps,
      id: "framework-slide-2",
      title: "Content with a purpose",
      href: "/en/about",
      description:
        "Connect pages, products and articles with reusable components.",
    },
    {
      ...defaultSlideProps,
      id: "framework-slide-3",
      title: "From a component to a complete page",
      description: "Keep the content and choose the presentation that fits.",
    },
  ],
};
export function Component({
  label = defaultSliderProps.label,
  navigation = "arrows",
  slides = defaultSliderProps.slides,
}: IComponentProps) {
  return (
    <ClientComponent label={label} slides={slides} navigation={navigation} />
  );
}
