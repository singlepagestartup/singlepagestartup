import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { logger } from "@sps/backend-utils";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: IModel["id"];
  email: string;
};

type IFindById = (props: { id: string }) => Promise<IModel | null>;

export interface IConstructorProps {
  findById: IFindById;
  identity: IdentityService;
  subjectsToIdentities: SubjectsToIdentitiesService;
}

export class Service {
  findById: IFindById;
  identity: IdentityService;
  subjectsToIdentities: SubjectsToIdentitiesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.identity = props.identity;
    this.subjectsToIdentities = props.subjectsToIdentities;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error(
        "Configuration error. RBAC_SECRET is not defined in the service",
      );
    }

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Not Found error. No entity found");
    }

    const subjectsToIdentities = await this.subjectsToIdentities.find({
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

    if (!subjectsToIdentities?.length) {
      const identity = await identityApi.findOrCreate({
        data: {
          email: props.email,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      logger.debug("🚀 ~ identity:", identity);

      await subjectsToIdentitiesApi.create({
        data: {
          subjectId: props.id,
          identityId: identity.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    } else {
      const identities = await this.identity.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectsToIdentities.map((item) => item.identityId),
              },
              {
                column: "email",
                method: "eq",
                value: props.email,
              },
            ],
          },
        },
      });

      if (!identities?.length) {
        const identity = await identityApi.create({
          data: {
            email: props.email,
            provider: "email",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await subjectsToIdentitiesApi.create({
          data: {
            subjectId: props.id,
            identityId: identity.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    return entity;
  }
}
