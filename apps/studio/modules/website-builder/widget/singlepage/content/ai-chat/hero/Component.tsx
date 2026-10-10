import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../../buttons-array";
import type { IWebsiteSection } from "../../../../../../../workspace/utils/products/ai-chat-content";
import defaultContent from "./content.json";

export interface IAIChatHeroProps {
  content?: { hero: IWebsiteSection; labels: Record<string, string> };
}
export function Component({ content = defaultContent }: IAIChatHeroProps = {}) {
  return (
    <section
      data-ds-block="website-builder.widget.content-ai-chat-hero"
      className="mx-auto max-w-6xl px-5 pb-6 pt-4 @3xl:px-8 @3xl:pt-6"
    >
      <div className="grid overflow-hidden rounded-2xl bg-sps-graphite text-white @3xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-6 @3xl:p-8">
          <p className="text-sm leading-6 text-sps-muted-inverse">
            <span className="mb-4 block h-1 w-10 bg-sps-green" />
            {content.hero.paragraphs[0]}
          </p>
          <h1 className="mt-5 max-w-md font-sps text-4xl font-semibold leading-tight tracking-normal">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-sps-muted-inverse">
            {content.hero.paragraphs[1]}
          </p>
          <div className="mt-6">
            <WebsiteBuilderModuleButtonsArray
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
          <p className="mt-4 max-w-md text-xs leading-5 text-sps-muted-inverse">
            {content.hero.paragraphs[2]}
          </p>
        </div>
        <figure className="flex items-center justify-center @3xl:p-5 @3xl:pl-0">
          <img
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-solo-founder-v1-square.png"
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
