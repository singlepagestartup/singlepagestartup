import type { IModel as ITask } from "@sps/crm/models/task/sdk/model";
import type { IModel as IStoreGrant } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/sdk/model";
import {
  taskChatStaffAuthor,
  CRM_WORKSPACE_STAFF_MESSAGE_PREFIX,
  type ICrmWorkspaceParticipant,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Service as Subject } from "../../index";
import { criteria, inIds } from "../../ecommerce/customer-work/utils";

const humanRoles = new Set([
  "owner",
  "crm-manager",
  "crm-manager-finance",
  "crm-worker",
]);
const identityRoles = new Set(["default", "telegram"]);

interface IChannel {
  chatId: string;
  threadId: string;
}

function uniqueStoreOwner(storeId: string, grants: IStoreGrant[]) {
  const owners = [
    ...new Set(
      grants
        .filter(
          ({ ecommerceModuleStoreId, variant }) =>
            ecommerceModuleStoreId === storeId && variant === "owner",
        )
        .map(({ subjectId }) => subjectId),
    ),
  ];
  return owners.length === 1 ? owners[0] : undefined;
}

export class Service {
  constructor(private readonly subject: Subject) {}

  async read(
    task: ITask,
    channel: IChannel,
  ): Promise<ICrmWorkspaceParticipant[]> {
    const { social, crm, ecommerce } = this.subject.modules;
    const storeGrants = this.subject.module.subjectsToEcommerceModuleStores;
    const identityLinks = this.subject.module.subjectsToSocialModuleProfiles;
    const [memberships, assignments, authors, owners, orders] =
      await Promise.all([
        social.profilesToChats.find(criteria({ chatId: channel.chatId })),
        crm.tasksToStages.find(criteria({ taskId: task.id, kind: "assigned" })),
        this.subject.repository.workspaceStaffAuthors({
          ...channel,
          taskId: task.id,
        }),
        task.orderId
          ? storeGrants.find(
              criteria({
                ecommerceModuleStoreId: task.storeId,
                variant: "owner",
              }),
            )
          : [],
        task.orderId
          ? ecommerce.storesToOrders.find(
              criteria({ storeId: task.storeId, orderId: task.orderId }),
            )
          : [],
      ]);
    const members = new Set<string>();
    const hiddenMembers = new Set<string>();
    for (const { chatId, profileId, variant } of memberships) {
      if (chatId !== channel.chatId) {
        continue;
      }
      const linkedProfiles = variant === "hidden" ? hiddenMembers : members;
      linkedProfiles.add(profileId);
    }
    const knownAssignees = new Set(
      assignments.flatMap(({ taskId, kind, detail }) =>
        taskId === task.id && kind === "assigned" && detail.assigneeId
          ? [detail.assigneeId]
          : [],
      ),
    );
    if (task.assigneeId) {
      knownAssignees.add(task.assigneeId);
    }
    const owner = uniqueStoreOwner(task.storeId, owners);
    if (
      owner &&
      orders.some(
        ({ storeId, orderId }) =>
          storeId === task.storeId && orderId === task.orderId,
      )
    ) {
      knownAssignees.add(owner);
    }

    const authorProfiles = new Map<string, Set<string>>();
    const proofProfiles = new Set(members);
    for (const { sourceSystemId, profileId, staffSubjectId } of authors) {
      if (
        hiddenMembers.has(profileId) ||
        (!staffSubjectId &&
          !sourceSystemId?.startsWith(
            CRM_WORKSPACE_STAFF_MESSAGE_PREFIX + task.id + ":",
          ))
      ) {
        continue;
      }
      const subjectId = taskChatStaffAuthor({
        sourceSystemId,
        metadata: { customerWorkStaffSubjectId: staffSubjectId },
      });
      if (!subjectId) {
        continue;
      }
      const profiles = authorProfiles.get(subjectId) ?? new Set<string>();
      profiles.add(profileId);
      authorProfiles.set(subjectId, profiles);
      proofProfiles.add(profileId);
    }

    const [existingIdentities, fallbackIdentities] = await Promise.all([
      proofProfiles.size
        ? identityLinks.find(inIds("socialModuleProfileId", proofProfiles))
        : [],
      knownAssignees.size
        ? identityLinks.find(
            inIds("subjectId", knownAssignees, { variant: "default" }),
          )
        : [],
    ]);
    const profilesBySubject = new Map<string, Set<string>>();
    for (const link of existingIdentities) {
      if (
        !identityRoles.has(link.variant) ||
        !(
          members.has(link.socialModuleProfileId) ||
          authorProfiles.get(link.subjectId)?.has(link.socialModuleProfileId)
        )
      ) {
        continue;
      }
      const profiles =
        profilesBySubject.get(link.subjectId) ?? new Set<string>();
      profiles.add(link.socialModuleProfileId);
      profilesBySubject.set(link.subjectId, profiles);
    }
    const fallbackProfiles = new Map<string, Set<string>>();
    for (const link of fallbackIdentities) {
      if (
        link.variant !== "default" ||
        !knownAssignees.has(link.subjectId) ||
        hiddenMembers.has(link.socialModuleProfileId)
      ) {
        continue;
      }
      const profiles =
        fallbackProfiles.get(link.subjectId) ?? new Set<string>();
      profiles.add(link.socialModuleProfileId);
      fallbackProfiles.set(link.subjectId, profiles);
    }

    const subjects = new Set([
      ...profilesBySubject.keys(),
      ...fallbackProfiles.keys(),
    ]);
    const selected = new Map<string, string>();
    for (const subjectId of subjects) {
      const profiles =
        profilesBySubject.get(subjectId) ?? fallbackProfiles.get(subjectId);
      if (profiles?.size === 1) {
        const [profileId] = profiles;
        selected.set(subjectId, profileId);
      }
    }
    if (!selected.size) {
      return [];
    }

    const subjectIds = new Set(selected.keys());
    const profileIds = new Set(selected.values());
    const [grants, assistantGrants, people, profiles, ownersByProfile] =
      await Promise.all([
        storeGrants.find(
          inIds("subjectId", subjectIds, {
            ecommerceModuleStoreId: task.storeId,
          }),
        ),
        storeGrants.find(
          inIds("subjectId", subjectIds, { variant: "assistant" }),
        ),
        this.subject.find(inIds("id", subjectIds)),
        social.profile.find(inIds("id", profileIds)),
        identityLinks.find(inIds("socialModuleProfileId", profileIds)),
      ]);
    const roleMap = new Map<string, Set<string>>();
    for (const grant of grants) {
      if (grant.ecommerceModuleStoreId !== task.storeId) {
        continue;
      }
      const roles = roleMap.get(grant.subjectId) ?? new Set<string>();
      roles.add(grant.variant);
      roleMap.set(grant.subjectId, roles);
    }
    const ownerMap = new Map<string, Set<string>>();
    for (const link of ownersByProfile) {
      if (!identityRoles.has(link.variant)) {
        continue;
      }
      const ids = ownerMap.get(link.socialModuleProfileId) ?? new Set<string>();
      ids.add(link.subjectId);
      ownerMap.set(link.socialModuleProfileId, ids);
    }
    const assistants = new Set(
      assistantGrants
        .filter(({ variant }) => variant === "assistant")
        .map(({ subjectId }) => subjectId),
    );
    const peopleById = new Map(people.map((person) => [person.id, person]));
    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );
    const candidates: ICrmWorkspaceParticipant[] = [];
    for (const [subjectId, profileId] of selected) {
      const person = peopleById.get(subjectId);
      const profile = profilesById.get(profileId);
      const ownership = ownerMap.get(profileId);
      const roles = roleMap.get(subjectId);
      if (
        !person ||
        !profile ||
        profile.variant === "hidden" ||
        !roles ||
        ownership?.size !== 1 ||
        !ownership.has(subjectId) ||
        ["anonymous", "hidden"].includes(person.variant)
      ) {
        continue;
      }
      const ai = person.variant === "agent";
      if (
        ai !== (profile.variant === "artificial-intelligence") ||
        (ai
          ? !roles.has("crm-agent") || assistants.has(subjectId)
          : ![...roles].some((role) => humanRoles.has(role)))
      ) {
        continue;
      }
      candidates.push({
        id: subjectId,
        name:
          profile.title?.ru?.trim() || profile.title?.en?.trim() || person.slug,
        kind: ai ? "ai" : "human",
        profileId,
      });
    }
    return candidates;
  }

  private async identityLinks(subjectId: string) {
    const links = await this.subject.module.subjectsToSocialModuleProfiles.find(
      criteria({ subjectId }),
    );
    return links.filter(
      (link) => link.subjectId === subjectId && identityRoles.has(link.variant),
    );
  }

  private defaultProfiles(
    links: Awaited<ReturnType<Service["identityLinks"]>>,
  ) {
    return [
      ...new Set(
        links
          .filter(({ variant }) => variant === "default")
          .map(({ socialModuleProfileId }) => socialModuleProfileId),
      ),
    ];
  }

  private async ownsIdentity(subjectId: string, profileId: string) {
    const links = await this.subject.module.subjectsToSocialModuleProfiles.find(
      criteria({ socialModuleProfileId: profileId }),
    );
    const identitySubjects = new Set(
      links
        .filter(
          ({ socialModuleProfileId, variant }) =>
            socialModuleProfileId === profileId && identityRoles.has(variant),
        )
        .map(({ subjectId }) => subjectId),
    );
    return identitySubjects.size === 1 && identitySubjects.has(subjectId);
  }

  async attach(chatId: string, profileId: string) {
    const relation = this.subject.modules.social.profilesToChats;
    const [current] = await relation.find(criteria({ chatId, profileId }));
    if (!current) {
      await relation.create({ data: { chatId, profileId } });
    }
  }

  async attachStoreOwner(storeId: string, chatId: string) {
    const owners =
      await this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({ ecommerceModuleStoreId: storeId, variant: "owner" }),
      );
    const subjectId = uniqueStoreOwner(storeId, owners);
    if (!subjectId) {
      return;
    }
    const [owner, links, memberships] = await Promise.all([
      this.subject.findById({ id: subjectId }),
      this.identityLinks(subjectId),
      this.subject.modules.social.profilesToChats.find(criteria({ chatId })),
    ]);
    if (!owner || ["agent", "anonymous", "hidden"].includes(owner.variant)) {
      return;
    }
    const ownerProfiles = new Set(
      links.map(({ socialModuleProfileId }) => socialModuleProfileId),
    );
    if (
      memberships.some(
        ({ chatId: linkedChatId, profileId }) =>
          linkedChatId === chatId && ownerProfiles.has(profileId),
      )
    ) {
      return;
    }
    const profiles = this.defaultProfiles(links);
    if (profiles.length !== 1) {
      return;
    }
    const [profileId] = profiles;
    const [profile, owned] = await Promise.all([
      this.subject.modules.social.profile.findById({ id: profileId }),
      this.ownsIdentity(subjectId, profileId),
    ]);
    if (
      owned &&
      profile &&
      !["artificial-intelligence", "hidden"].includes(profile.variant)
    ) {
      await this.attach(chatId, profileId);
    }
  }
}
