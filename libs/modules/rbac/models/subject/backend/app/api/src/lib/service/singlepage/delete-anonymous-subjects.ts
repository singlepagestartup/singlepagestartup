import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { logger } from "@sps/backend-utils";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { IModel } from "@sps/rbac/models/subject/sdk/model";

export type IExecuteProps = {};

export interface IConstructorProps {
  find: (props?: any) => Promise<IModel[]>;
  subjectsToIdentities: SubjectsToIdentitiesService;
}

export class Service {
  find: (props?: any) => Promise<IModel[]>;
  subjectsToIdentities: SubjectsToIdentitiesService;

  constructor(props: IConstructorProps) {
    this.find = props.find;
    this.subjectsToIdentities = props.subjectsToIdentities;
  }

  async execute(props?: IExecuteProps) {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is required");
      }

      const existingSubjects = await this.find({
        params: {
          filters: {
            and: [
              {
                column: "createdAt",
                method: "lt",
                value: new Date(
                  Date.now() - 1000 * 60 * 60 * 24 * 30,
                ).toISOString(),
              },
            ],
          },
        },
      });

      if (existingSubjects?.length) {
        for (const existingSubject of existingSubjects) {
          const subjectsToIdentities = await this.subjectsToIdentities.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: existingSubject.id,
                  },
                ],
              },
            },
          });

          if (!subjectsToIdentities?.length) {
            await subjectApi.delete({
              id: existingSubject.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error("🚀 ~ clearAnonymusSessions ~ error:", error);
    }
  }
}
