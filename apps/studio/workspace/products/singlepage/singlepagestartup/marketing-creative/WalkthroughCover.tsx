import "../../../../styles/singlepage.css";
import { ArtifactFrame } from "../../../../utils/media/ArtifactFrame";
import sourceText from "./walkthrough-cover.md?raw";
import {
  creativeAssets,
  creativeTypography,
  parseCreativeCover,
  type ICreativeTextProps,
} from "./content";

interface IWalkthroughArtworkProps extends ICreativeTextProps {
  photoScale?: number;
  copyOffset?: number;
}

/** Raw 1280 × 720 artwork, also used by the motion composition. */
export function WalkthroughArtwork({
  text,
  photoScale = 1,
  copyOffset = 0,
}: IWalkthroughArtworkProps = {}) {
  const copy = parseCreativeCover(text ?? sourceText);
  return (
    <div
      data-workspace-projection="singlepage"
      className={`relative h-full w-full overflow-hidden bg-[#F7F6F2] text-[#111111] ${creativeTypography.body}`}
    >
      <img
        src={copy.image.src}
        alt={copy.image.alt}
        className="absolute right-0 top-0 h-[720px] w-[1080px] object-contain"
        style={{ transform: `scale(${photoScale})` }}
      />
      <div className="absolute inset-y-0 left-0 w-[200px] bg-[#F7F6F2]" />
      <div className="absolute left-[44px] top-[44px] bg-[#F7F6F2] px-[22px] py-[18px]">
        <img
          src={creativeAssets.logo}
          alt="SinglePageStartup"
          className="w-[238px]"
        />
      </div>
      <div
        className="absolute bottom-[64px] left-[44px] w-[622px] bg-[#F7F6F2]/95 px-[34px] pb-[32px] pt-[27px]"
        style={{ transform: `translateY(${copyOffset}px)` }}
      >
        <h1
          className={`${creativeTypography.display} text-[98px] font-semibold leading-[0.91] tracking-[-0.025em]`}
        >
          {copy.title}
        </h1>
        <p className="mt-[26px] max-w-[495px] text-[20px] leading-[1.5]">
          {copy.description}
        </p>
        <span className="mt-[25px] inline-block bg-[#BFEF61] px-[20px] py-[13px] text-[17px] font-semibold">
          {copy.action}
        </span>
      </div>
    </div>
  );
}
export default function WalkthroughCover(props: ICreativeTextProps = {}) {
  return (
    <ArtifactFrame
      width={1280}
      height={720}
      fileName="code-framework-walkthrough"
    >
      <WalkthroughArtwork {...props} />
    </ArtifactFrame>
  );
}
