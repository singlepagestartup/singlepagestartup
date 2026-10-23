import type { Service as SubjectService } from "../../index";
import type { Repository } from "../../../../repository";

export interface IEnsureProps {
  subjectId: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  private async ensureEntity(props: {
    service: {
      find: (props: any) => Promise<any[]>;
      create: (props: any) => Promise<any>;
    };
    filters: { column: string; method: "eq"; value: string }[];
    data: Record<string, unknown>;
  }) {
    const find = () =>
      props.service.find({
        params: { filters: { and: props.filters }, limit: 2 },
      });
    const existing = await find();
    if (existing.length > 1)
      throw new Error(
        "Data integrity error. Multiple records match one Subject profile ownership grant",
      );
    if (existing[0]) return existing[0];
    try {
      return await props.service.create({ data: props.data });
    } catch (error) {
      const concurrent = await find();
      if (concurrent.length === 1) return concurrent[0];
      throw error;
    }
  }

  async ensure({ subjectId }: IEnsureProps) {
    return (this.service.repository as Repository).withSubjectLock(
      { subjectId },
      () => this.ensureLocked({ subjectId }),
    );
  }

  private async ensureLocked({ subjectId }: IEnsureProps) {
    const subject = await this.service.findById({ id: subjectId });
    if (
      !subject ||
      subject.variant === "agent" ||
      subject.variant === "anonymous"
    )
      throw new Error("Authorization error. A registered Subject is required");
    const identities = await this.service.subjectsToIdentities.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        },
      },
    });
    if (!identities.length)
      throw new Error("Authorization error. Sign in to manage profiles");

    // Existing assistant grants identify the owner independently of shared Chat membership.
    const assignments = await this.service.subjectsToRoles.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        },
      },
    });
    const ownedRoles = assignments.length
      ? await this.service.role.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: assignments.map((link) => link.roleId),
                },
              ],
            },
          },
        })
      : [];
    for (const ownedRole of ownedRoles) {
      const profileId =
        /^social-profile-([0-9a-f-]{36})-knowledge-owner$/i.exec(
          ownedRole.slug,
        )?.[1];
      if (!profileId) continue;
      const descriptors = await this.service.permission.find({
        params: {
          filters: {
            and: [
              {
                column: "path",
                method: "eq",
                value: `/api/rbac/subjects/${subjectId}/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/profiles/${profileId}/knowledge/sources`,
              },
              { column: "method", method: "eq", value: "GET" },
              { column: "type", method: "eq", value: "HTTP" },
            ],
          },
          limit: 2,
        },
      });
      if (descriptors.length !== 1) continue;
      const grants = await this.service.rolesToPermissions.find({
        params: {
          filters: {
            and: [
              { column: "roleId", method: "eq", value: ownedRole.id },
              {
                column: "permissionId",
                method: "eq",
                value: descriptors[0].id,
              },
            ],
          },
          limit: 1,
        },
      });
      if (!grants.length) continue;
      const assistant = await this.service.socialModule.profile.findById({
        id: profileId,
      });
      if (assistant?.variant !== "artificial-intelligence") continue;
      await this.ensureEntity({
        service: this.service.subjectsToSocialModuleProfiles,
        filters: [
          { column: "subjectId", method: "eq", value: subjectId },
          { column: "socialModuleProfileId", method: "eq", value: profileId },
        ],
        data: {
          subjectId,
          socialModuleProfileId: profileId,
          variant: "assistant",
        },
      });
    }

    const links = await this.service.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        },
      },
    });
    const profiles = links.length
      ? await this.service.socialModule.profile.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: links.map((link) => link.socialModuleProfileId),
                },
              ],
            },
          },
        })
      : [];
    for (const link of links) {
      if (
        link.variant === "default" &&
        profiles.some(
          (profile) =>
            profile.id === link.socialModuleProfileId &&
            profile.variant === "artificial-intelligence",
        )
      )
        await this.service.subjectsToSocialModuleProfiles.update({
          id: link.id,
          data: { ...link, variant: "assistant" },
        });
    }
    const personal = profiles.filter(
      (profile) =>
        profile.variant !== "artificial-intelligence" &&
        links.some(
          (link) =>
            link.socialModuleProfileId === profile.id &&
            link.variant === "default",
        ),
    );
    if (personal.length > 1)
      throw new Error(
        "Data integrity error. A Subject must have one personal profile",
      );
    const profile =
      personal[0] ??
      (await this.ensureEntity({
        service: {
          find: (props) => this.service.socialModule.profile.find(props),
          create: (props) => this.service.socialModule.profile.create(props),
        },
        filters: [
          { column: "slug", method: "eq", value: `subject-${subjectId}` },
        ],
        data: {
          slug: `subject-${subjectId}`,
          variant: "default",
          title: { en: subject.slug || "My account" },
        },
      }));
    const profileOwners =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: profile.id,
              },
            ],
          },
        },
      });
    if (
      !["default", "telegram"].includes(profile.variant) ||
      profileOwners.some((link) => link.subjectId !== subjectId)
    )
      throw new Error(
        "Data integrity error. The personal profile belongs to another Subject",
      );
    await this.ensureEntity({
      service: this.service.subjectsToSocialModuleProfiles,
      filters: [
        { column: "subjectId", method: "eq", value: subjectId },
        { column: "socialModuleProfileId", method: "eq", value: profile.id },
      ],
      data: {
        subjectId,
        socialModuleProfileId: profile.id,
        variant: "default",
      },
    });

    const role = await this.ensureEntity({
      service: this.service.role,
      filters: [
        {
          column: "slug",
          method: "eq",
          value: `subject-${subjectId}-profiles-owner`,
        },
      ],
      data: {
        slug: `subject-${subjectId}-profiles-owner`,
        title: `Own social profiles for Subject ${subjectId}`,
        variant: "default",
        availableOnRegistration: false,
      },
    });
    const path = `/api/rbac/subjects/${subjectId}/social-module/profiles`;
    const permissions: Record<string, unknown>[] = [];
    const descriptors = [
      { method: "GET", path: `/api/rbac/subjects/${subjectId}` },
      {
        method: "GET",
        path: `/api/rbac/subjects/${subjectId}/billing-module/balance`,
      },
      { method: "GET", path },
      { method: "GET", path: `${path}/projects` },
      { method: "POST", path },
      { method: "GET", path: `/api/rbac/subjects/${subjectId}/identities` },
      { method: "PATCH", path: `${path}/${profile.id}` },
      { method: "POST", path: `${path}/${profile.id}/avatar` },
      { method: "GET", path: `${path}/${profile.id}/avatar` },
      ...identities.flatMap((identity) => [
        {
          method: "PATCH",
          path: `/api/rbac/subjects/${subjectId}/identities/${identity.identityId}`,
        },
        {
          method: "POST",
          path: `/api/rbac/subjects/${subjectId}/identities/${identity.identityId}/email-change/code`,
        },
        {
          method: "POST",
          path: `/api/rbac/subjects/${subjectId}/identities/${identity.identityId}/email-change/verify`,
        },
      ]),
    ];
    for (const { method, path: permissionPath } of descriptors) {
      const permission = await this.ensureEntity({
        service: this.service.permission,
        filters: [
          { column: "path", method: "eq", value: permissionPath },
          { column: "method", method: "eq", value: method },
          { column: "type", method: "eq", value: "HTTP" },
        ],
        data: {
          path: permissionPath,
          method,
          type: "HTTP",
          variant: "default",
        },
      });
      await this.ensureEntity({
        service: this.service.rolesToPermissions,
        filters: [
          { column: "roleId", method: "eq", value: role.id },
          { column: "permissionId", method: "eq", value: permission.id },
        ],
        data: {
          roleId: role.id,
          permissionId: permission.id,
          variant: "default",
        },
      });
      permissions.push(permission);
    }
    await this.ensureEntity({
      service: this.service.subjectsToRoles,
      filters: [
        { column: "subjectId", method: "eq", value: subjectId },
        { column: "roleId", method: "eq", value: role.id },
      ],
      data: { subjectId, roleId: role.id, variant: "default" },
    });
    this.service.permission.invalidateRouteResolutionCache();
    this.service.isAuthorizedService.invalidateSubjectRoleCache(subjectId);
    return { profile, role, permissions };
  }
}
