import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/profile/backend/repository/database";
import { Repository } from "../../repository";
import { Service as ChatService } from "@sps/social/models/chat/backend/app/api/src/lib/service";
import { Service as ProfilesToChatsService } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/service";
import { ProfileDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  chat: ChatService;
  profilesToChats: ProfilesToChatsService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ProfileDI.IChatsService) chat: ChatService,
    @inject(ProfileDI.IProfilesToChatsService)
    profilesToChats: ProfilesToChatsService,
  ) {
    super(repository);
    this.chat = chat;
    this.profilesToChats = profilesToChats;
  }
}
