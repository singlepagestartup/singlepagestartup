import "../../../../styles/singlepage.css";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./repository-preview.md?raw";
import {
  creativeAssets,
  creativeTypography,
  parseCreativeCover,
  type ICreativeTextProps,
} from "./content";
export function RepositoryArtwork({ text }: ICreativeTextProps = {}) {
  const copy = parseCreativeCover(text ?? sourceText);
  return (
    <div
      data-workspace-projection="singlepage"
      className={`relative h-full w-full overflow-hidden bg-[#F7F6F2] text-[#111111] ${creativeTypography.body}`}
    >
      <img
        src={copy.image.src}
        alt={copy.image.alt}
        className="absolute right-0 top-0 h-[630px] w-[630px] object-contain"
      />
      <img
        src={creativeAssets.logo}
        alt="SinglePageStartup"
        className="absolute left-[54px] top-[48px] w-[253px]"
      />
      <div className="absolute left-[54px] top-[177px] w-[554px] bg-[#F7F6F2]/95 pb-[24px] pr-[20px]">
        <h1
          className={`${creativeTypography.display} text-[93px] font-semibold leading-[0.91] tracking-[-0.025em]`}
        >
          {copy.title}
        </h1>
        <p className="mt-[28px] max-w-[420px] text-[21px] leading-[1.45]">
          {copy.description}
        </p>
      </div>
      <div className="absolute bottom-[48px] left-[54px] flex items-center gap-[18px]">
        <span className="h-[12px] w-[54px] bg-[#BFEF61]" aria-hidden="true" />
        <span className="text-[16px]">{copy.action}</span>
      </div>
    </div>
  );
}
export default function RepositoryCover(props: ICreativeTextProps = {}) {
  return (
    <ArtifactFrame
      width={1200}
      height={630}
      fileName="code-framework-repository"
    >
      <RepositoryArtwork {...props} />
    </ArtifactFrame>
  );
}
