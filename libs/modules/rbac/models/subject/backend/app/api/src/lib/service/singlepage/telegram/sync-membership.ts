import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as RolesToEcommerceModuleProductsService } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/service";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";

export interface IExecuteProps {
  id: string;
  memberStatus?: string;
}

export interface IResult {
  addedRoleIds: string[];
  removedRoleIds: string[];
}

export interface IConstructorProps {
  role: RoleService;
  subjectsToRoles: SubjectsToRolesService;
  rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService;
}

export class Service {
  role: RoleService;
  subjectsToRoles: SubjectsToRolesService;
  rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService;

  constructor(props: IConstructorProps) {
    this.role = props.role;
    this.subjectsToRoles = props.subjectsToRoles;
    this.rolesToEcommerceModuleProducts = props.rolesToEcommerceModuleProducts;
  }

  private getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!props.id) {
      throw new Error("Validation error. 'id' is required");
    }

    const headers = this.getSdkHeaders();
    const addedRoleIds: string[] = [];
    const removedRoleIds: string[] = [];

    const requiredSubscriptionRoles = await this.role.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: "required-telegram-channel-subscriber",
            },
          ],
        },
      },
    });

    const requiredSubscriptionRole = requiredSubscriptionRoles?.[0];

    if (requiredSubscriptionRole && props.memberStatus) {
      const requiredRoleSubjectLinks = await this.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.id,
              },
              {
                column: "roleId",
                method: "eq",
                value: requiredSubscriptionRole.id,
              },
            ],
          },
        },
      });

      if (
        ["administrator", "member", "creator"].includes(props.memberStatus) &&
        !requiredRoleSubjectLinks?.length
      ) {
        await subjectsToRolesApi.create({
          data: {
            subjectId: props.id,
            roleId: requiredSubscriptionRole.id,
          },
          options: {
            headers,
          },
        });
        addedRoleIds.push(requiredSubscriptionRole.id);
      }

      if (
        ["restricted", "left", "kicked"].includes(props.memberStatus) &&
        requiredRoleSubjectLinks?.length
      ) {
        for (const subjectToRole of requiredRoleSubjectLinks) {
          await subjectsToRolesApi.delete({
            id: subjectToRole.id,
            options: {
              headers,
            },
          });
        }
        removedRoleIds.push(requiredSubscriptionRole.id);
      }
    }

    const availableOnRegistrationRoles = await this.role.find({
      params: {
        filters: {
          and: [
            {
              column: "availableOnRegistration",
              method: "eq",
              value: true,
            },
          ],
        },
      },
    });

    if (availableOnRegistrationRoles?.length) {
      const rolesToEcommerceModuleProducts =
        await this.rolesToEcommerceModuleProducts.find({
          params: {
            filters: {
              and: [
                {
                  column: "roleId",
                  method: "inArray",
                  value: availableOnRegistrationRoles.map((role) => role.id),
                },
              ],
            },
          },
        });

      const productBoundRoleIds = new Set(
        (rolesToEcommerceModuleProducts ?? []).map((item) => item.roleId),
      );

      const availableOnRegistrationNonProductRoles =
        availableOnRegistrationRoles.filter((role) => {
          return !productBoundRoleIds.has(role.id);
        });

      if (!availableOnRegistrationNonProductRoles.length) {
        return {
          addedRoleIds: Array.from(new Set(addedRoleIds)),
          removedRoleIds: Array.from(new Set(removedRoleIds)),
        };
      }

      const subjectToRoles = await this.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      });

      const existingRoleIds = new Set(
        (subjectToRoles ?? []).map((item) => item.roleId),
      );

      const missingRoles = availableOnRegistrationNonProductRoles.filter(
        (role) => {
          return !existingRoleIds.has(role.id);
        },
      );

      for (const missingRole of missingRoles) {
        await subjectsToRolesApi.create({
          data: {
            subjectId: props.id,
            roleId: missingRole.id,
          },
          options: {
            headers,
          },
        });
        addedRoleIds.push(missingRole.id);
      }
    }

    return {
      addedRoleIds: Array.from(new Set(addedRoleIds)),
      removedRoleIds: Array.from(new Set(removedRoleIds)),
    };
  }
}
