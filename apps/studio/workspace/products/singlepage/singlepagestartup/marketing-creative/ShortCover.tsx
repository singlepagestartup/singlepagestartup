import "../../../../styles/singlepage.css";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./short-cover.md?raw";
import {
  creativeAssets,
  creativeTypography,
  parseCreativeCover,
  type ICreativeTextProps,
} from "./content";
export function ShortArtwork({ text }: ICreativeTextProps = {}) {
  const copy = parseCreativeCover(text ?? sourceText);
  return (
    <div
      data-workspace-projection="singlepage"
      className={`relative h-full w-full overflow-hidden bg-[var(--workspace-brand-foreground)] text-white ${creativeTypography.body}`}
    >
      <img
        src={copy.image.src}
        alt={copy.image.alt}
        className="absolute bottom-[228px] left-0 h-[940px] w-[1080px] object-cover"
      />
      <div className="absolute inset-x-0 top-0 h-[198px] bg-white" />
      <img
        src={creativeAssets.logo}
        alt="SinglePageStartup"
        className="absolute left-[72px] top-[74px] w-[350px]"
      />
      <div className="absolute left-[72px] top-[265px] w-[910px]">
        <h1
          className={`${creativeTypography.display} text-[110px] font-semibold leading-[1.04] tracking-[-0.035em]`}
        >
          {copy.title}
        </h1>
      </div>
      <div className="absolute bottom-[80px] left-[72px] right-[72px] flex items-center justify-between gap-[36px]">
        <p className="text-[25px]">{copy.description}</p>
        <span className="rounded-2xl bg-[var(--workspace-brand-accent)] px-[27px] py-[21px] text-[26px] font-semibold text-[var(--workspace-brand-foreground)]">
          {copy.action}
        </span>
      </div>
    </div>
  );
}
export default function ShortCover(props: ICreativeTextProps = {}) {
  return (
    <ArtifactFrame
      width={1080}
      height={1920}
      fileName="code-framework-short-cover"
    >
      <ShortArtwork {...props} />
    </ArtifactFrame>
  );
}
