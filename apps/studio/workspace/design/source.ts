import singlepageAssets from "../assets/singlepage.yaml?raw";
import singlepageDesign from "./singlepage.md?raw";
import startupAssets from "../assets/startup.yaml?raw";
import startupDesign from "./startup.md?raw";
import {
  combineProjectWorkspaces,
  projectArtifactWorkspaces,
} from "../project-source";

const design = projectArtifactWorkspaces({
  kind: "design",
  singlepage: singlepageDesign,
  startup: startupDesign,
});

const assets = projectArtifactWorkspaces({
  kind: "asset-index",
  singlepage: singlepageAssets,
  startup: startupAssets,
});

export const designWorkspaces = {
  default: combineProjectWorkspaces([design.default, assets.default]),
  singlepage: combineProjectWorkspaces([design.singlepage, assets.singlepage]),
  startup: combineProjectWorkspaces([design.startup, assets.startup]),
};
