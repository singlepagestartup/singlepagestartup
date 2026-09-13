import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MotionPreview } from "../../../../../../../apps/studio/workspace/utils/media/MotionPreview";

export default function Motion({ text = "" }: { text?: string }) {
  const composition = useMemo(
    () => ({
      id: "course-motion",
      width: 640,
      height: 360,
      fps: 30,
      durationInFrames: 30,
      component: function Frame() {
        const frame = useCurrentFrame();
        return (
          <AbsoluteFill
            className="justify-center bg-amber-100 p-12"
            style={{
              opacity: interpolate(frame, [0, 10], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <h1 className="text-4xl font-bold">
              {text.split("\n")[0].replace(/^# /, "")}
            </h1>
            <p className="mt-4 text-xl">A course created for this startup.</p>
          </AbsoluteFill>
        );
      },
    }),
    [text],
  );
  return (
    <MotionPreview
      composition={composition}
      title="Course motion"
      fileName="course-motion.mp4"
    />
  );
}
