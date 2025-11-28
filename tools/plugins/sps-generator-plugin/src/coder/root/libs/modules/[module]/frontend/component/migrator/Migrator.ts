import { Coder } from "../Coder";
import { releases } from "./releases";

export class Migrator {
  coder: Coder;
  releases = releases;

  constructor({ coder }: { coder: Coder }) {
    this.coder = coder;
  }

  async execute({ version }: { version: keyof typeof releases }) {
    const release = new releases[version]({ parent: this });

    await release.execute();
  }
}
