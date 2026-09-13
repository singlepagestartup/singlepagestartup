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
      className={`relative h-full w-full overflow-hidden bg-[#F7F6F2] text-[#111111] ${creativeTypography.body}`}
    >
      <img
        src={copy.image.src}
        alt={copy.image.alt}
        className="absolute bottom-[200px] left-0 h-[1080px] w-[1080px] object-contain"
      />
      <img
        src={creativeAssets.logo}
        alt="SinglePageStartup"
        className="absolute left-[72px] top-[74px] w-[350px]"
      />
      <div className="absolute left-[72px] top-[265px] w-[910px] bg-[#F7F6F2]/95 pb-[40px] pr-[30px]">
        <h1
          className={`${creativeTypography.display} text-[135px] font-semibold leading-[0.95] tracking-[-0.03em]`}
        >
          {copy.title}
        </h1>
      </div>
      <div className="absolute bottom-[80px] left-[72px] right-[72px] flex items-center justify-between gap-[36px]">
        <p className="text-[25px]">{copy.description}</p>
        <span className="bg-[#BFEF61] px-[27px] py-[21px] text-[26px] font-semibold">
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
