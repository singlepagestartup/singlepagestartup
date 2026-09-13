import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import sourceText from "./short-storyboard.md?raw";
import {
  creativeAssets,
  creativeTypography,
  parseStoryboard,
  type ICreativeTextProps,
} from "./content";
const sceneImages = [
  creativeAssets.conversation,
  creativeAssets.modules,
  creativeAssets.agents,
  creativeAssets.motion,
  creativeAssets.modules,
];
export default function ShortStoryboard({ text }: ICreativeTextProps = {}) {
  const copy = parseStoryboard(text ?? sourceText);
  return (
    <article
      data-workspace-projection="singlepage"
      className={`bg-[#F7F6F2] p-6 text-[#111111] sm:p-10 ${creativeTypography.body}`}
    >
      <img
        src={creativeAssets.logo}
        alt="SinglePageStartup"
        className="mb-10 w-48"
      />
      <h1
        className={`${creativeTypography.display} max-w-3xl text-5xl font-semibold leading-none sm:text-6xl`}
      >
        {copy.title}
      </h1>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed">
        {copy.description}
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {copy.scenes.map((scene, index) => (
          <section
            key={`${index}-${scene.time}`}
            className="overflow-hidden border border-[#CBC9C3] bg-white"
          >
            <div className="relative flex aspect-[9/16] flex-col overflow-hidden bg-[#F7F6F2]">
              <span className="absolute right-4 top-4 z-10 bg-[#BFEF61] px-3 py-1 text-xs">
                {scene.time}
              </span>
              <img
                src={creativeAssets.logo}
                alt="SinglePageStartup"
                className="m-6 mt-16 w-32"
              />
              <p
                className={`${creativeTypography.display} relative z-10 mx-6 mb-4 text-4xl font-semibold leading-none`}
              >
                {scene.screen}
              </p>
              <img
                src={sceneImages[index] ?? creativeAssets.modules}
                alt={scene.visual}
                className="mt-auto aspect-square w-full object-contain"
              />
            </div>
            <dl className="space-y-4 border-t border-[#CBC9C3] p-5 text-xs leading-relaxed">
              <div>
                <dt className="mb-1 font-semibold text-[#565656]">
                  {copy.labels[1]}
                </dt>
                <dd>{scene.visual}</dd>
              </div>
              <div>
                <dt className="mb-1 font-semibold text-[#565656]">
                  {copy.labels[3]}
                </dt>
                <dd>{scene.voiceover}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
      <div className="mt-10 max-w-3xl">
        <MarkdownDocument>{copy.closing}</MarkdownDocument>
      </div>
    </article>
  );
}
