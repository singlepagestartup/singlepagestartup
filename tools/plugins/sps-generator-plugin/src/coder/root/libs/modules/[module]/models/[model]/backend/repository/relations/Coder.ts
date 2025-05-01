import { Tree } from "@nx/devkit";
import {
  Coder as RootCoder,
  IGeneratorProps as IRootCoderGeneratorProps,
} from "./root/Coder";
import { Coder as SchemaCoder } from "../Coder";
import {
  Coder as RelationCoder,
  IGeneratorProps as IModelCoderGeneratorProps,
} from "./[relation]/Coder";

export type IGeneratorProps = {
  relations?: IModelCoderGeneratorProps[];
  root?: IRootCoderGeneratorProps;
};

export class Coder {
  parent: SchemaCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  name: string;
  project: {
    root: RootCoder;
    relations?: RelationCoder[];
  } = {} as {
    root: RootCoder;
    relations?: RelationCoder[];
  };

  constructor(props: { parent: SchemaCoder; tree: Tree } & IGeneratorProps) {
    this.name = "relations";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${props.parent.baseName}-relations`;
    this.baseDirectory = `${props.parent.baseDirectory}/relations`;
    this.absoluteName = `${props.parent.absoluteName}/relations`;

    this.project.root = new RootCoder({
      parent: this,
      tree: this.tree,
    });

    if (props.relations) {
      this.project.relations = props.relations.map((relation) => {
        return new RelationCoder({
          ...relation,
          parent: this,
          tree: this.tree,
        });
      });
    }
  }

  async create() {
    await this.project.root.create();

    if (this.project.relations) {
      for (const relation of this.project.relations) {
        await relation.create();
      }
    }
  }

  async migrate(props: { version: string }) {
    await this.project.root.migrate(props);

    if (this.project.relations) {
      for (const relation of this.project.relations) {
        await relation.migrate(props);
      }
    }
  }

  async remove() {
    if (this.project.relations) {
      for (const relation of this.project.relations) {
        await relation.remove();
      }
    }

    await this.project.root.remove();
  }
}
