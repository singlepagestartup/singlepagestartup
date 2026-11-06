import briefSinglepage from "../brief/singlepage.md?raw";
import briefStartup from "../brief/startup.md?raw";
import strategySinglepage from "../strategy/singlepage.md?raw";
import strategyStartup from "../strategy/startup.md?raw";
import brandSinglepage from "../brand/singlepage.md?raw";
import brandStartup from "../brand/startup.md?raw";
import { projectArtifactWorkspaces } from "./project-source";

export const projectArtifacts = {
  brief: projectArtifactWorkspaces({
    kind: "brief",
    singlepage: briefSinglepage,
    startup: briefStartup,
  }),
  strategy: projectArtifactWorkspaces({
    kind: "strategy",
    singlepage: strategySinglepage,
    startup: strategyStartup,
  }),
  brand: projectArtifactWorkspaces({
    kind: "brand",
    singlepage: brandSinglepage,
    startup: brandStartup,
  }),
};
