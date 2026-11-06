import type { IComponentProps, IAIChatHeroProps } from "./interface";
export type { IAIChatHeroProps } from "./interface";
import { Component as ButtonsArray } from "../../../../../buttons-array/index";
import type { IWebsiteSection } from "../content";
import defaultContent from "./content.json";

export function Component({
  variant = "content-ai-chat-hero",
  content = defaultContent,
}: IComponentProps = {}) {
  return (
    <section
      data-ds-block="website-builder.widget.content-ai-chat-hero"
      className="mx-auto max-w-6xl px-5 pb-6 pt-4 @3xl:px-8 @3xl:pt-6"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="grid overflow-hidden rounded-2xl bg-default text-default-foreground @3xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-6 @3xl:p-8">
          <p className="text-sm leading-6 text-default-muted-foreground">
            <span className="mb-4 block h-1 w-10 bg-primary text-primary-foreground" />
            {content.hero.paragraphs[0]}
          </p>
          <h1 className="mt-5 max-w-md font-default text-4xl font-semibold leading-tight tracking-normal">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-default-muted-foreground">
            {content.hero.paragraphs[1]}
          </p>
          <div className="mt-6">
            <ButtonsArray
              variant="default"
              buttons={[
                {
                  label: content.hero.links[0].text,
                  href: content.hero.links[0].href,
                  variant: "primary",
                },
                {
                  label: content.labels["navigation-foundation"],
                  href: "#workflow",
                  target: "_self",
                  variant: "secondary",
                  inverse: true,
                },
              ]}
            />
          </div>
          <p className="mt-4 max-w-md text-xs leading-5 text-default-muted-foreground">
            {content.hero.paragraphs[2]}
          </p>
        </div>
        <figure className="flex items-center justify-center @3xl:p-5 @3xl:pl-0">
          <img
            src="/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-solo-founder-v1-square.png"
            data-asset-id="singlepage-generated-living-focus-photography-solo-founder-v1-square"
            alt={content.labels["hero-photo-alt"]}
            width={1254}
            height={1254}
            className="block aspect-square h-auto w-full object-contain @3xl:rounded-xl"
          />
        </figure>
      </div>
    </section>
  );
}
