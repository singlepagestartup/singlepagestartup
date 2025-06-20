import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { logger } from "@sps/backend-utils";

export type IExecuteProps = {};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props?: IExecuteProps) {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY is not defined in the service");
      }

      const existingSubjects = await subjectApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (existingSubjects?.length) {
        for (const existingSubject of existingSubjects) {
          const subjectsToIdentities = await subjectsToIdentitiesApi.find({
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
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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
