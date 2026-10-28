import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/profile/backend/repository/database";
import { Repository } from "../../repository";
import { Service as ChatService } from "@sps/social/models/chat/backend/app/api/src/lib/service";
import { Service as ProfilesToChatsService } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/service";
import { ProfileDI } from "../../di";
import {
  Service as Authors,
  type IDependencies as IAuthorDependencies,
} from "./authors";
import type {
  IAuthorFindParams,
  IAuthorFilters,
} from "@sps/social/models/profile/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  chat: ChatService;
  profilesToChats: ProfilesToChatsService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ProfileDI.IChatsService) chat: ChatService,
    @inject(ProfileDI.IProfilesToChatsService)
    profilesToChats: ProfilesToChatsService,
    @inject(ProfileDI.IAuthorDependencies)
    readonly authorDependencies: Omit<IAuthorDependencies, "profile">,
  ) {
    super(repository);
    this.chat = chat;
    this.profilesToChats = profilesToChats;
  }

  authorFind(params: IAuthorFindParams = {}) {
    return new Authors({ ...this.authorDependencies, profile: this }).find(
      params,
    );
  }
  authorFindCount(params: IAuthorFilters = {}) {
    return new Authors({ ...this.authorDependencies, profile: this }).count(
      params,
    );
  }
  authorFindById(props: { id: string }) {
    return new Authors({ ...this.authorDependencies, profile: this }).findById(
      props,
    );
  }
  async profilePresentation(props: { id: string }) {
    const profile = await this.findById(props);
    if (!profile) return null;
    const presentation = await new Authors({
      ...this.authorDependencies,
      profile: this,
    }).presentation(profile);
    // This service capability is used only after Chat access is established.
    // Preserve its existing display name without returning private field names.
    if (
      !Object.values(profile.title || {}).some(
        (value) => typeof value === "string" && value.trim(),
      )
    ) {
      const displayTitle = profile.adminTitle?.trim();
      if (displayTitle)
        presentation.title = { en: displayTitle, ru: displayTitle };
    }
    return presentation;
  }
}
