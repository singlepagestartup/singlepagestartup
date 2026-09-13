import { ArtifactFrame } from "../../../../../../../apps/studio/workspace/utils/media/ArtifactFrame";
import { MarkdownDocument } from "../../../../../../../apps/studio/workspace/utils/components/ArtifactBrowser";

export default function Cover({ text = "" }: { text?: string }) {
  return (
    <ArtifactFrame width={640} height={360} fileName="course-cover.png">
      <div className="flex h-full flex-col justify-center bg-amber-100 p-12">
        <MarkdownDocument>{text}</MarkdownDocument>
      </div>
    </ArtifactFrame>
  );
}
