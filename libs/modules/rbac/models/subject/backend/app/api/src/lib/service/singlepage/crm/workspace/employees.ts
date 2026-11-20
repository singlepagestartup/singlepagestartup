import { z } from "zod";
import type { IModel as IChat } from "@sps/social/models/chat/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import {
  STORE_EMPLOYEE_CHAT_VARIANT,
  type ICrmWorkspaceEmployee,
  type ICrmWorkspaceEmployeeChat,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Service as Subject } from "../../index";
import { criteria } from "../../ecommerce/customer-work/utils";

export const storeEmployeeChatSlugPrefix = "store-employee-training-";

export interface IStoreEmployeeTrainingScope {
  storeId: string;
  subjectId: string;
  profileId: string;
  actorProfileId: string;
  chatId: string;
  threadId: string;
}

type TChatIdentity = Pick<IChat, "id" | "variant"> &
  Partial<Pick<IChat, "slug" | "sourceSystemId">>;

const chatIdentitySchema = z.tuple([z.uuid(), z.uuid(), z.uuid()]);

export class Service {
  constructor(private readonly subject: Subject) {}

  private get social() {
    return this.subject.modules.social;
  }

  async canManage(actorId: string, storeId: string) {
    const [admin, owners] = await Promise.all([
      this.subject.isAdmin(actorId),
      this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({
          subjectId: actorId,
          ecommerceModuleStoreId: storeId,
          variant: "owner",
        }),
      ),
    ]);
    return admin || owners.length > 0;
  }

  private async assertManager(actorId: string, storeId: string) {
    if (!(await this.canManage(actorId, storeId))) {
      throw new Error(
        "Permission error. Store employee management requires an owner or administrator",
      );
    }
  }

  private async profiles(subjectId: string) {
    const { params } = criteria({ subjectId, variant: "default" });
    const links = await this.subject.module.subjectsToSocialModuleProfiles.find(
      {
        params: {
          ...params,
          orderBy: {
            and: [
              { column: "createdAt", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
        },
      },
    );
    const profiles = await Promise.all(
      links.map(({ socialModuleProfileId }) =>
        this.social.profile.findById({ id: socialModuleProfileId }),
      ),
    );
    return profiles.filter((profile) => profile !== null);
  }

  async agentProfile(subjectId: string) {
    const profiles = await this.profiles(subjectId);
    const aiProfiles = profiles.filter(
      (profile) => profile.variant === "artificial-intelligence",
    );
    if (aiProfiles.length === 1) {
      return aiProfiles[0];
    }
    return undefined;
  }

  name(profile: IProfile) {
    return profile.title?.ru || profile.title?.en || profile.adminTitle;
  }

  private async employee(storeId: string, subjectId: string) {
    const [agent, grants, profile] = await Promise.all([
      this.subject.findById({ id: subjectId }),
      this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({ subjectId }),
      ),
      this.agentProfile(subjectId),
    ]);
    if (agent?.variant !== "agent" || !profile) {
      return undefined;
    }
    const storeAgents = grants.filter(({ variant }) => variant === "crm-agent");
    if (
      !storeAgents.length ||
      storeAgents.some(
        ({ ecommerceModuleStoreId }) => ecommerceModuleStoreId !== storeId,
      ) ||
      grants.some(({ variant }) => variant === "assistant")
    ) {
      return undefined;
    }
    const profileGrants =
      await this.subject.module.subjectsToSocialModuleProfiles.find(
        criteria({ socialModuleProfileId: profile.id }),
      );
    if (profileGrants.some((grant) => grant.subjectId !== subjectId)) {
      return undefined;
    }
    return { id: agent.id, profileId: profile.id, name: this.name(profile) };
  }

  async list(storeId: string, ids: string[]): Promise<ICrmWorkspaceEmployee[]> {
    const employees = await Promise.all(
      ids.map((id) => this.employee(storeId, id)),
    );
    return employees.filter((employee) => employee !== undefined);
  }

  async assertAgent(actorId: string, storeId: string, subjectId: string) {
    await this.assertManager(actorId, storeId);
    const employee = await this.employee(storeId, subjectId);
    if (!employee) {
      throw new Error("Not Found error. Store employee is unavailable");
    }
    return employee;
  }

  private async ensureActorProfile(subjectId: string) {
    const profiles = await this.profiles(subjectId);
    const existing = profiles.find(
      (profile) => profile.variant !== "artificial-intelligence",
    );
    if (existing) {
      return existing.id;
    }
    const profile = await this.social.profile.create({
      data: { variant: "default" },
    });
    await this.subject.module.subjectsToSocialModuleProfiles.create({
      data: {
        subjectId,
        socialModuleProfileId: profile.id,
        variant: "default",
      },
    });
    return profile.id;
  }

  private unavailable(): never {
    throw new Error(
      "Not Found error. Store employee conversation is unavailable",
    );
  }

  async scopeForChat(
    actorId: string,
    chat: TChatIdentity,
    requestedThreadId?: string,
  ): Promise<IStoreEmployeeTrainingScope> {
    const identity = chatIdentitySchema.safeParse(
      chat.sourceSystemId?.split(":"),
    );
    if (chat.variant !== STORE_EMPLOYEE_CHAT_VARIANT || !identity.success) {
      this.unavailable();
    }
    const [storeId, ownerId, subjectId] = identity.data;
    if (
      ownerId !== actorId ||
      chat.slug !==
        `${storeEmployeeChatSlugPrefix}${identity.data.join("-")}` ||
      !(await this.canManage(actorId, storeId))
    ) {
      this.unavailable();
    }

    const [employee, profiles, members, threads] = await Promise.all([
      this.employee(storeId, subjectId),
      this.profiles(actorId),
      this.social.profilesToChats.find(criteria({ chatId: chat.id })),
      this.social.chatsToThreads.find(criteria({ chatId: chat.id })),
    ]);
    if (!employee || members.length !== 2 || threads.length !== 1) {
      this.unavailable();
    }
    const [chatThread] = threads;
    if (
      chatThread.variant !== "default" ||
      (requestedThreadId && chatThread.threadId !== requestedThreadId) ||
      !members.some((member) => member.profileId === employee.profileId)
    ) {
      this.unavailable();
    }
    const actorProfile = profiles.find(
      (profile) =>
        profile.variant !== "artificial-intelligence" &&
        members.some((member) => member.profileId === profile.id),
    );
    if (!actorProfile) {
      this.unavailable();
    }

    return {
      storeId,
      subjectId,
      profileId: employee.profileId,
      actorProfileId: actorProfile.id,
      chatId: chat.id,
      threadId: chatThread.threadId,
    };
  }

  private async openChat(
    actorId: string,
    storeId: string,
    employee: ICrmWorkspaceEmployee,
  ): Promise<ICrmWorkspaceEmployeeChat> {
    const identity = [storeId, actorId, employee.id];
    const slug = `${storeEmployeeChatSlugPrefix}${identity.join("-")}`;
    const [existing] = await this.social.chat.find(criteria({ slug }));
    if (existing) {
      const { chatId, threadId } = await this.scopeForChat(actorId, existing);
      return {
        id: employee.id,
        profileId: employee.profileId,
        chatId,
        threadId,
      };
    }

    const actorProfileId = await this.ensureActorProfile(actorId);
    const chat = await this.social.chat.create({
      data: {
        slug,
        title: employee.name,
        variant: STORE_EMPLOYEE_CHAT_VARIANT,
        sourceSystemId: identity.join(":"),
      },
    });
    const thread = await this.social.thread.create({
      data: { title: employee.name, variant: "default" },
    });
    for (const profileId of [actorProfileId, employee.profileId]) {
      await this.social.profilesToChats.create({
        data: { chatId: chat.id, profileId },
      });
    }
    await this.social.chatsToThreads.create({
      data: { chatId: chat.id, threadId: thread.id, variant: "default" },
    });
    return {
      id: employee.id,
      profileId: employee.profileId,
      chatId: chat.id,
      threadId: thread.id,
    };
  }

  async open(actorId: string, input: { storeId: string; subjectId: string }) {
    const storeId = input.storeId.toLowerCase();
    return this.subject.repository.withStoreEmployeeLock(actorId, async () => {
      const employee = await this.assertAgent(
        actorId,
        storeId,
        input.subjectId,
      );
      return this.openChat(actorId, storeId, employee);
    });
  }

  async create(
    actorId: string,
    input: { storeId: string; name: string; operationKey: string },
  ) {
    const storeId = input.storeId.toLowerCase();
    const slug = `store-employee-${storeId}-${actorId}-${input.operationKey.toLowerCase()}`;
    return this.subject.repository.withStoreEmployeeLock(actorId, async () => {
      await this.assertManager(actorId, storeId);
      const store = await this.subject.modules.ecommerce.store.findById({
        id: storeId,
      });
      if (!store) {
        throw new Error("Not Found error. Store is unavailable");
      }

      const [existing] = await this.subject.find(criteria({ slug }));
      if (existing) {
        const employee = await this.employee(storeId, existing.id);
        if (!employee) {
          throw new Error(
            "Conflict error. Employee creation key is already in use",
          );
        }
        return this.openChat(actorId, storeId, employee);
      }

      const agent = await this.subject.create({
        data: { slug, variant: "agent" },
      });
      const profile = await this.social.profile.create({
        data: {
          slug,
          title: { ru: input.name, en: input.name },
          adminTitle: input.name,
          variant: "artificial-intelligence",
        },
      });
      await this.subject.module.subjectsToSocialModuleProfiles.create({
        data: {
          subjectId: agent.id,
          socialModuleProfileId: profile.id,
          variant: "default",
        },
      });
      await this.subject.module.subjectsToEcommerceModuleStores.create({
        data: {
          subjectId: agent.id,
          ecommerceModuleStoreId: storeId,
          variant: "crm-agent",
        },
      });
      return this.openChat(actorId, storeId, {
        id: agent.id,
        name: input.name,
        profileId: profile.id,
      });
    });
  }
}
