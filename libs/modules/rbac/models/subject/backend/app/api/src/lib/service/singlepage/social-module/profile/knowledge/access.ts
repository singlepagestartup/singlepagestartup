import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";

export interface IEnsureSocialProfileKnowledgeAccessProps {
  ownerRbacSubjectId: string;
  socialModuleProfileId: string;
}

export interface IKnowledgePermissionDescriptor {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
}

export interface IConstructorProps {
  permission: PermissionService;
  role: RoleService;
  rolesToPermissions: RolesToPermissionsService;
  subjectsToRoles: SubjectsToRolesService;
}

export function getSocialProfileKnowledgePermissionDescriptors(
  props: IEnsureSocialProfileKnowledgeAccessProps,
): IKnowledgePermissionDescriptor[] {
  const collectionPath = [
    "/api/rbac/subjects",
    props.ownerRbacSubjectId,
    "social-module/profiles/[social.profiles.id]",
    "chats/[social.chats.id]",
    `profiles/${props.socialModuleProfileId}`,
    "knowledge/documents",
  ].join("/");
  const documentPath = `${collectionPath}/[knowledge.documents.id]`;

  return [
    { method: "GET", path: collectionPath },
    { method: "POST", path: collectionPath },
    { method: "PATCH", path: documentPath },
    { method: "POST", path: `${documentPath}/reindex` },
    { method: "DELETE", path: documentPath },
  ];
}

export class SocialProfileKnowledgeAccessService {
  protected permission: PermissionService;
  protected role: RoleService;
  protected rolesToPermissions: RolesToPermissionsService;
  protected subjectsToRoles: SubjectsToRolesService;

  constructor(props: IConstructorProps) {
    this.permission = props.permission;
    this.role = props.role;
    this.rolesToPermissions = props.rolesToPermissions;
    this.subjectsToRoles = props.subjectsToRoles;
  }

  protected async findSingle(props: {
    service: {
      find: (props: any) => Promise<any[]>;
    };
    filters: Array<{ column: string; method: "eq"; value: string }>;
    entityName: string;
  }) {
    const entities = await props.service.find({
      params: {
        filters: {
          and: props.filters,
        },
        limit: 2,
      },
    });

    if (entities.length > 1) {
      throw new Error(
        `Data integrity error. Multiple ${props.entityName} records match one social.profile Knowledge access grant.`,
      );
    }

    return entities[0];
  }

  protected async ensureEntity(props: {
    service: {
      create: (props: { data: any }) => Promise<any>;
      find: (props: any) => Promise<any[]>;
    };
    filters: Array<{ column: string; method: "eq"; value: string }>;
    data: Record<string, unknown>;
    entityName: string;
  }) {
    const existing = await this.findSingle(props);

    if (existing) {
      return existing;
    }

    try {
      return await props.service.create({ data: props.data });
    } catch (error) {
      const concurrentlyCreated = await this.findSingle(props);

      if (concurrentlyCreated) {
        return concurrentlyCreated;
      }

      throw error;
    }
  }

  async ensure(props: IEnsureSocialProfileKnowledgeAccessProps) {
    if (!props.ownerRbacSubjectId?.trim()) {
      throw new Error(
        "Validation error. Knowledge access owner rbac.subject id is required.",
      );
    }

    if (!props.socialModuleProfileId?.trim()) {
      throw new Error(
        "Validation error. Knowledge access social.profile id is required.",
      );
    }

    const roleSlug = `social-profile-${props.socialModuleProfileId}-knowledge-owner`;
    const role = await this.ensureEntity({
      service: this.role,
      filters: [{ column: "slug", method: "eq", value: roleSlug }],
      data: {
        title: `Knowledge owner for social.profile ${props.socialModuleProfileId}`,
        slug: roleSlug,
        variant: "default",
        availableOnRegistration: false,
      },
      entityName: "rbac.role",
    });

    const permissions: Array<Record<string, any>> = [];

    for (const descriptor of getSocialProfileKnowledgePermissionDescriptors(
      props,
    )) {
      const permission = await this.ensureEntity({
        service: this.permission,
        filters: [
          { column: "type", method: "eq", value: "HTTP" },
          { column: "method", method: "eq", value: descriptor.method },
          { column: "path", method: "eq", value: descriptor.path },
        ],
        data: {
          type: "HTTP",
          method: descriptor.method,
          path: descriptor.path,
          variant: "default",
        },
        entityName: "rbac.permission",
      });

      permissions.push(permission);

      await this.ensureEntity({
        service: this.rolesToPermissions,
        filters: [
          { column: "roleId", method: "eq", value: role.id },
          {
            column: "permissionId",
            method: "eq",
            value: permission.id,
          },
        ],
        data: {
          roleId: role.id,
          permissionId: permission.id,
          variant: "default",
        },
        entityName: "rbac.roles-to-permissions relation",
      });
    }

    const subjectToRole = await this.ensureEntity({
      service: this.subjectsToRoles,
      filters: [
        {
          column: "subjectId",
          method: "eq",
          value: props.ownerRbacSubjectId,
        },
        { column: "roleId", method: "eq", value: role.id },
      ],
      data: {
        subjectId: props.ownerRbacSubjectId,
        roleId: role.id,
        variant: "default",
      },
      entityName: "rbac.subjects-to-roles relation",
    });

    this.permission.invalidateRouteResolutionCache();

    return {
      role,
      permissions,
      subjectToRole,
    };
  }
}
