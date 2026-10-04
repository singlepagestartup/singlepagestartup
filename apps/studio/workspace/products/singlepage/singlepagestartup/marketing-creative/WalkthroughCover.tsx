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
      className={`relative h-full w-full overflow-hidden bg-[var(--workspace-brand-foreground)] text-white ${creativeTypography.body}`}
    >
      <img
        src={copy.image.src}
        alt={copy.image.alt}
        className="absolute bottom-0 left-0 h-[612px] w-[600px] object-cover"
        style={{ transform: `scale(${photoScale})` }}
      />
      <div className="absolute inset-x-0 top-0 flex h-[108px] items-center bg-white px-[44px]">
        <img
          src={creativeAssets.logo}
          alt="SinglePageStartup"
          className="w-[238px]"
        />
      </div>
      <div
        className="absolute bottom-[64px] right-[54px] w-[560px]"
        style={{ transform: `translateY(${copyOffset}px)` }}
      >
        <h1
          className={`${creativeTypography.display} text-[76px] font-semibold leading-[1.04] tracking-[-0.035em]`}
        >
          {copy.title}
        </h1>
        <p className="mt-[26px] max-w-[495px] text-[22px] leading-[1.5] text-white/80">
          {copy.description}
        </p>
        <span className="mt-[25px] inline-block rounded-xl bg-[var(--workspace-brand-accent)] px-[20px] py-[13px] text-[17px] font-semibold text-[var(--workspace-brand-foreground)]">
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
