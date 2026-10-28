import { moduleArtwork } from "../content";
import type { IModuleScene } from "./content";
import Scenario from "./Scenario";

interface IModuleVisualProps {
  moduleId: string;
  scene?: IModuleScene;
  compact?: boolean;
}

export default function ModuleVisual({
  moduleId,
  scene,
  compact = false,
}: IModuleVisualProps) {
  const artwork = moduleArtwork[moduleId];
  return (
    <div
      aria-hidden="true"
      className={`flex h-full min-w-0 items-center justify-center overflow-hidden ${artwork ? "bg-white" : "bg-[#eaf0ed]"} ${compact ? "p-3" : "p-6 @3xl:p-8"}`}
    >
      {artwork ? (
        <img
          src={artwork.src}
          data-asset-id={artwork.id}
          alt=""
          loading="lazy"
          width={1024}
          height={1024}
          className={`w-full object-contain ${compact ? "max-h-48" : "max-h-96"}`}
        />
      ) : scene ? (
        <div className={`w-full ${compact ? "max-w-64" : "max-w-sm"}`}>
          <Scenario moduleId={moduleId} scene={scene} compact={compact} />
        </div>
      ) : null}
    </div>
  );
}
