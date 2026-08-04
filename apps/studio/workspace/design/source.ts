import singlepageAssets from "../assets/singlepage.yaml?raw";
import singlepageBrand from "../brand/singlepage.md?raw";
import startupAssets from "../assets/startup.yaml?raw";
import startupBrand from "../brand/startup.md?raw";
import singlepageWebsite from "../website/singlepage.md?raw";
import startupWebsite from "../website/startup.md?raw";
import {
  combineProjectWorkspaces,
  projectArtifactWorkspaces,
} from "../project-source";

const brand = projectArtifactWorkspaces({
  kind: "brand",
  singlepage: singlepageBrand,
  startup: startupBrand,
});

const website = projectArtifactWorkspaces({
  kind: "website",
  singlepage: singlepageWebsite,
  startup: startupWebsite,
});

const assets = projectArtifactWorkspaces({
  kind: "asset-index",
  singlepage: singlepageAssets,
  startup: startupAssets,
});

export const designWorkspaces = {
  current: combineProjectWorkspaces([
    brand.current,
    website.current,
    assets.current,
  ]),
  singlepage: combineProjectWorkspaces([
    brand.singlepage,
    website.singlepage,
    assets.singlepage,
  ]),
  startup: combineProjectWorkspaces([
    brand.startup,
    website.startup,
    assets.startup,
  ]),
};
