import "reflect-metadata";
import { injectable } from "inversify";
import {
  type ITelegramCommandDefinitionOverride,
  Service as ParentService,
} from "../singlepage";

@injectable()
export class Service extends ParentService {
  protected getStartupTelegramCommandDefinitions(): ITelegramCommandDefinitionOverride[] {
    return [];
  }

  protected override getTelegramCommandDefinitions() {
    return this.mergeTelegramCommandDefinitions({
      base: super.getTelegramCommandDefinitions(),
      overrides: this.getStartupTelegramCommandDefinitions(),
    });
  }
}
