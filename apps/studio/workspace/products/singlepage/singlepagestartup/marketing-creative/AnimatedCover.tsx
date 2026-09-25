import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MotionPreview } from "../../../../utils/media/MotionPreview";
import { WalkthroughArtwork } from "./WalkthroughCover";
import type { ICreativeTextProps } from "./content";
import sourceText from "./walkthrough-cover.md?raw";

/** The static and animated covers share their copy, image, and editable artwork. */
export default function AnimatedCover({ text }: ICreativeTextProps = {}) {
  const copy = text ?? sourceText;
  const composition = useMemo(() => {
    function CoverScene() {
      const frame = useCurrentFrame();
      const photoScale = interpolate(frame, [0, 89], [1, 1.045], {
        extrapolateRight: "clamp",
      });
      const offset = interpolate(frame, [0, 20], [18, 0], {
        extrapolateRight: "clamp",
      });
      return (
        <AbsoluteFill className="bg-[#F7F6F2]">
          <WalkthroughArtwork
            text={copy}
            photoScale={photoScale}
            copyOffset={offset}
          />
        </AbsoluteFill>
      );
    }
    return {
      id: "singlepage-singlepagestartup-walkthrough",
      component: CoverScene,
      width: 1280,
      height: 720,
      fps: 30,
      durationInFrames: 90,
    };
  }, [copy]);
  return (
    <MotionPreview
      composition={composition}
      title="Animated walkthrough cover"
      fileName="code-framework-animated-cover"
    />
  );
}
