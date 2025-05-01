import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import { Coder as ComponentCoder } from "../Coder";
import * as nxWorkspace from "@nx/workspace";
import path from "path";
import { Migrator } from "./migrator/Migrator";
import { util as createSpsReactLibrary } from "../../../../../../../utils/create-sps-react-library";

export type IGeneratorProps = unknown;

export class Coder {
  parent: ComponentCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  name: string;
  project?: ProjectConfiguration;
  importPath: string;

  constructor(props: { parent: ComponentCoder; tree: Tree } & IGeneratorProps) {
    this.name = "component";
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}`;
    this.baseDirectory = `${this.parent.baseDirectory}/component`;
    this.absoluteName = `${this.parent.absoluteName}/component`;
    this.tree = props.tree;

    this.importPath = this.absoluteName;

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async migrate(props: { version: string }) {
    const migrator = new Migrator({
      coder: this,
    });

    const version = props.version as keyof typeof migrator.releases;
    await migrator.execute({ version });
  }

  async create() {
    if (this.project) {
      return;
    }

    const moduleName = this.parent.parent.baseName;

    await createSpsReactLibrary({
      generateFilesPath: path.join(__dirname, "files"),
      name: this.baseName,
      root: this.baseDirectory,
      templateParams: {
        module_name: moduleName,
      },
      tree: this.tree,
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }
}
